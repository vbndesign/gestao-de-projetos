import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOKENS_PATH = path.resolve(__dirname, "../tokens/spacing.json");
const FIGMA_API_BASE = process.env.FIGMA_API_BASE ?? "https://api.figma.com/v1";
const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN;
const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY;
const COLLECTION_NAME = "Primitives";
const DEFAULT_MODE_NAME = "Default";

const ALLOWED_SPACING_SCALE = [4, 8, 12, 16, 24, 32, 40, 48, 56, 64, 72, 80, 96, 120];

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parsePx(value, label) {
  assert(typeof value === "string" && /^\d+px$/.test(value), `${label} must be a string in the format "Npx" (e.g. "8px"), got: ${JSON.stringify(value)}.`);
  return parseInt(value, 10);
}

function validateSpacingTokens(tokens) {
  assert(tokens && typeof tokens === "object", "Token file must export an object.");
  assert(tokens.spacing && typeof tokens.spacing === "object", 'Missing top-level "spacing" object.');

  const keys = Object.keys(tokens.spacing).map(Number).sort((a, b) => a - b);
  const expectedKeys = [...ALLOWED_SPACING_SCALE];

  assert(
    JSON.stringify(keys) === JSON.stringify(expectedKeys),
    `spacing keys must be exactly: ${expectedKeys.join(", ")}. Got: ${keys.join(", ")}.`,
  );

  for (const [key, value] of Object.entries(tokens.spacing)) {
    const parsed = parsePx(value, `spacing.${key}`);
    assert(parsed === Number(key), `spacing.${key} value must equal ${key}px, got ${value}.`);
  }
}

// ---------------------------------------------------------------------------
// Definitions
// ---------------------------------------------------------------------------

function toPrimitiveDefinitions(tokens) {
  return Object.entries(tokens.spacing)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([key, value]) => ({
      collectionName: COLLECTION_NAME,
      name: `spacing/${key}`,
      resolvedType: "FLOAT",
      scopes: ["GAP", "WIDTH_HEIGHT"],
      value: {
        kind: "RAW",
        value: parsePx(value, `spacing.${key}`),
      },
    }));
}

// ---------------------------------------------------------------------------
// Figma API helpers (shared pattern with sync-typography-to-figma.mjs)
// ---------------------------------------------------------------------------

function collectionKey(collectionName, variableName) {
  return `${collectionName}::${variableName}`;
}

function sortScopes(scopes) {
  return [].concat(scopes || []).sort();
}

async function figmaRequest(method, endpoint, body) {
  const response = await fetch(`${FIGMA_API_BASE}${endpoint}`, {
    method,
    headers: {
      "X-Figma-Token": FIGMA_ACCESS_TOKEN,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Figma API ${method} ${endpoint} failed: ${response.status} ${errorText}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

async function loadTokens() {
  const raw = await readFile(TOKENS_PATH, "utf8");
  const tokens = JSON.parse(raw);
  validateSpacingTokens(tokens);
  return tokens;
}

function getCollections(payload) {
  const collections = payload?.meta?.variableCollections ?? payload?.meta?.localVariableCollections ?? {};
  return Object.values(collections);
}

function getVariables(payload) {
  const variables = payload?.meta?.variables ?? payload?.meta?.localVariables ?? {};
  return Object.values(variables);
}

async function getLocalVariables() {
  return figmaRequest("GET", `/files/${FIGMA_FILE_KEY}/variables/local`);
}

async function ensureCollection(existingCollections) {
  const collectionMap = new Map(existingCollections.map((c) => [c.name, c]));

  if (!collectionMap.has(COLLECTION_NAME)) {
    const tempCollectionId = `tmp_collection_${COLLECTION_NAME.toLowerCase()}`;
    const tempModeId = `tmp_mode_${COLLECTION_NAME.toLowerCase()}`;

    const result = await figmaRequest("POST", `/files/${FIGMA_FILE_KEY}/variables`, {
      variableCollections: [
        {
          action: "CREATE",
          id: tempCollectionId,
          name: COLLECTION_NAME,
          initialModeId: tempModeId,
        },
      ],
      variableModes: [
        {
          action: "UPDATE",
          id: tempModeId,
          name: DEFAULT_MODE_NAME,
          variableCollectionId: tempCollectionId,
        },
      ],
    });

    const tempIdToRealId = result?.meta?.tempIdToRealId ?? result?.tempIdToRealId ?? {};
    collectionMap.set(COLLECTION_NAME, {
      id: tempIdToRealId[tempCollectionId],
      name: COLLECTION_NAME,
      defaultModeId: tempIdToRealId[tempModeId],
      modes: [{ modeId: tempIdToRealId[tempModeId], name: DEFAULT_MODE_NAME }],
    });
  }

  const collection = collectionMap.get(COLLECTION_NAME);
  assert(collection, `Missing variable collection ${COLLECTION_NAME}.`);

  const modeId = collection.defaultModeId || (collection.modes[0] ? collection.modes[0].modeId : null);
  assert(modeId, `Collection ${COLLECTION_NAME} must have at least one mode.`);

  return { collectionId: collection.id, modeId };
}

function buildSyncPayload(definitions, collectionMeta, existingVariables) {
  const existingVariableMap = new Map(
    existingVariables.map((variable) => [
      collectionKey(COLLECTION_NAME, variable.name),
      variable,
    ]),
  );

  const definitionIdMap = new Map();
  const variables = [];
  const variableModeValues = [];

  for (const definition of definitions) {
    const key = collectionKey(definition.collectionName, definition.name);
    const existingVariable = existingVariableMap.get(key);

    if (existingVariable) {
      assert(
        existingVariable.resolvedType === definition.resolvedType,
        `Variable ${definition.name} already exists with type ${existingVariable.resolvedType}, expected ${definition.resolvedType}.`,
      );

      definitionIdMap.set(key, existingVariable.id);

      const existingScopes = sortScopes(existingVariable.scopes);
      const nextScopes = sortScopes(definition.scopes);

      if (JSON.stringify(existingScopes) !== JSON.stringify(nextScopes)) {
        variables.push({
          action: "UPDATE",
          id: existingVariable.id,
          scopes: nextScopes,
        });
      }

      continue;
    }

    const tempVariableId = `tmp_${definition.name.replace(/\//g, "_")}`;
    definitionIdMap.set(key, tempVariableId);
    variables.push({
      action: "CREATE",
      id: tempVariableId,
      name: definition.name,
      variableCollectionId: collectionMeta.collectionId,
      resolvedType: definition.resolvedType,
      scopes: definition.scopes,
    });
  }

  for (const definition of definitions) {
    const key = collectionKey(definition.collectionName, definition.name);
    const variableId = definitionIdMap.get(key);
    const existingVariable = existingVariableMap.get(key);
    const nextValue = definition.value.value;

    if (!existingVariable || existingVariable.valuesByMode?.[collectionMeta.modeId] !== nextValue) {
      variableModeValues.push({
        variableId,
        modeId: collectionMeta.modeId,
        value: nextValue,
      });
    }
  }

  return { variables, variableModeValues };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function syncSpacingVariables() {
  const tokens = await loadTokens();
  const definitions = toPrimitiveDefinitions(tokens);

  if (process.argv.includes("--validate")) {
    console.log(`Validated ${definitions.length} spacing variables from ${TOKENS_PATH}.`);
    return;
  }

  assert(FIGMA_ACCESS_TOKEN, "Missing FIGMA_ACCESS_TOKEN environment variable.");
  assert(FIGMA_FILE_KEY, "Missing FIGMA_FILE_KEY environment variable.");

  const localVariablesPayload = await getLocalVariables();
  const collections = getCollections(localVariablesPayload);
  const variables = getVariables(localVariablesPayload);
  const collectionMeta = await ensureCollection(collections);

  const existingVariables = variables.filter(
    (variable) => variable.variableCollectionId === collectionMeta.collectionId,
  );

  const payload = buildSyncPayload(definitions, collectionMeta, existingVariables);

  if (payload.variables.length === 0 && payload.variableModeValues.length === 0) {
    console.log("Spacing variables are already in sync.");
    return;
  }

  await figmaRequest("POST", `/files/${FIGMA_FILE_KEY}/variables`, payload);

  console.log(`Synced ${definitions.length} spacing variables to "${COLLECTION_NAME}".`);
}

syncSpacingVariables().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
