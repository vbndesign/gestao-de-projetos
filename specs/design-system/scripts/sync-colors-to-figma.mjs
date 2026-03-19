import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOKENS_PATH = path.resolve(__dirname, "../tokens/colors.json");
const FIGMA_API_BASE = process.env.FIGMA_API_BASE ?? "https://api.figma.com/v1";
const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN;
const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY;
const COLLECTIONS = {
  PRIMITIVES: "Primitives",
  SEMANTIC: "Semantic",
  COMPONENTS: "Components",
};
const DEFAULT_MODE_NAME = "Default";
const COLOR_SCOPES = ["ALL_SCOPES"];

// ---------------------------------------------------------------------------
// Validation constants (mirrors code.js)
// ---------------------------------------------------------------------------

const EXPECTED_COLOR_PRIMITIVE_KEYS = {
  common: ["transparent"],
  brand: ["900", "800", "700", "600", "500", "400", "300", "200", "100", "50"],
  neutral: ["900", "800", "700", "600", "500", "400", "300", "200", "100", "50", "0"],
  success: ["800", "700", "500", "300", "100"],
  warning: ["800", "700", "500", "300", "100"],
  danger: ["800", "700", "500", "300", "100"],
  info: ["800", "700", "500", "300", "100"],
};

const EXPECTED_COLOR_SEMANTIC_KEYS = {
  family: {
    common: ["transparent"],
    brand: ["subtle", "light", "soft", "pure", "strong"],
    neutral: ["pure", "subtle", "soft", "border", "muted", "medium", "body", "strong", "inverse"],
    success: ["light", "soft", "pure", "strong"],
    green: ["light", "strong"],
    warning: ["light", "soft", "pure", "strong"],
    danger: ["light", "soft", "pure", "strong"],
    red: ["light", "strong"],
    info: ["light", "soft", "pure", "strong"],
    indigo: ["light", "strong"],
    yellow: ["light", "strong"],
    pink: ["light", "strong"],
    sky: ["light", "strong"],
  },
  bg: ["canvas", "surface", "subtle", "brand", "inverse"],
  text: ["heading", "body", "muted", "placeholder", "disabled"],
  border: ["default", "subtle", "strong", "brand", "focus", "inverse"],
  icon: ["brand", "neutral", "inverse", "purple", "indigo", "yellow", "pink", "green", "sky", "red"],
  feedback: {
    success: ["bg", "surface", "text", "border"],
    warning: ["bg", "surface", "text", "border"],
    danger: ["bg", "surface", "text", "border"],
    info: ["bg", "surface", "text", "border"],
  },
  component: {
    menuItem: {
      default: ["bg", "icon", "text"],
      hover: ["bg", "icon", "text"],
      active: ["bg", "icon", "text"],
    },
    projectSummaryCard: ["bg", "title", "label"],
    button: {
      filled: {
        brand: {
          default: ["bg", "text", "icon"],
          hover: ["bg", "text", "icon"],
          disabled: ["bg", "text", "icon"],
        },
        neutral: {
          default: ["bg", "text", "icon"],
          hover: ["bg", "text", "icon"],
          disabled: ["bg", "text", "icon"],
        },
      },
      outline: {
        brand: {
          default: ["bg", "text", "icon", "border"],
          hover: ["bg", "text", "icon", "border"],
          disabled: ["bg", "text", "icon", "border"],
        },
        neutral: {
          default: ["bg", "text", "icon", "border"],
          hover: ["bg", "text", "icon", "border"],
          disabled: ["bg", "text", "icon", "border"],
        },
      },
    },
    badge: {
      purple: ["bg", "text"],
      indigo: ["bg", "text"],
      yellow: ["bg", "text"],
      pink: ["bg", "text"],
      green: ["bg", "text"],
      sky: ["bg", "text"],
      red: ["bg", "text"],
    },
    iconTile: {
      purple: ["bg", "icon"],
      indigo: ["bg", "icon"],
      yellow: ["bg", "icon"],
      pink: ["bg", "icon"],
      green: ["bg", "icon"],
      sky: ["bg", "icon"],
      red: ["bg", "icon"],
    },
    buttonIcon: {
      filled: {
        default: ["bg", "icon"],
        hover: ["bg", "icon"],
        disabled: ["bg", "icon"],
      },
      transparent: {
        default: ["bg", "icon"],
      },
    },
    dataRow: {
      header: ["bg", "text"],
      default: ["title", "bg", "border"],
      hover: ["title", "bg", "border"],
    },
  },
};

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function ensureExactKeys(actual, expectedKeys, label) {
  const actualKeys = Object.keys(actual).sort();
  const sortedExpectedKeys = [...expectedKeys].sort();
  assert(
    JSON.stringify(actualKeys) === JSON.stringify(sortedExpectedKeys),
    `${label} must contain exactly: ${sortedExpectedKeys.join(", ")}.`,
  );
}

function validateHexColor(value, label) {
  assert(
    /^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(value),
    `${label} must be a 6-digit or 8-digit hex color, got: ${JSON.stringify(value)}.`,
  );
}

function isHexColor(value) {
  return typeof value === "string" && /^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(value);
}

function validateTokenRef(value, label) {
  assert(
    /^\{color\.(primitive|semantic|component)\.[a-zA-Z0-9_.]+\}$/.test(value),
    `${label} must be a valid color token reference (e.g. {color.primitive.brand.500}), got: ${JSON.stringify(value)}.`,
  );
}

function validateColorTokenValue(value, label) {
  if (isHexColor(value)) {
    validateHexColor(value, label);
    return;
  }
  validateTokenRef(value, label);
}

function validateComponentShape(actual, expected, label) {
  if (Array.isArray(expected)) {
    assert(isPlainObject(actual), `${label} must be an object.`);
    ensureExactKeys(actual, expected, label);
    for (const key of expected) {
      validateColorTokenValue(actual[key], `${label}.${key}`);
    }
    return;
  }

  assert(isPlainObject(actual), `${label} must be an object.`);
  ensureExactKeys(actual, Object.keys(expected), label);

  for (const [key, shape] of Object.entries(expected)) {
    validateComponentShape(actual[key], shape, `${label}.${key}`);
  }
}

function validateColorTokens(tokens) {
  assert(isPlainObject(tokens), "Token file must export an object.");
  assert(isPlainObject(tokens.color), 'Missing top-level "color" object.');
  assert(isPlainObject(tokens.color.primitive), "Missing color.primitive.");
  assert(isPlainObject(tokens.color.semantic), "Missing color.semantic.");
  assert(isPlainObject(tokens.color.component), "Missing color.component.");

  ensureExactKeys(tokens.color, ["primitive", "semantic", "component"], "color");
  ensureExactKeys(tokens.color.primitive, Object.keys(EXPECTED_COLOR_PRIMITIVE_KEYS), "color.primitive");

  for (const [paletteName, expectedSteps] of Object.entries(EXPECTED_COLOR_PRIMITIVE_KEYS)) {
    const palette = tokens.color.primitive[paletteName];
    assert(isPlainObject(palette), `color.primitive.${paletteName} must be an object.`);
    ensureExactKeys(palette, expectedSteps, `color.primitive.${paletteName}`);
    for (const [step, value] of Object.entries(palette)) {
      validateHexColor(value, `color.primitive.${paletteName}.${step}`);
    }
  }

  ensureExactKeys(
    tokens.color.semantic,
    ["family", "bg", "text", "border", "icon", "feedback"],
    "color.semantic",
  );
  ensureExactKeys(
    tokens.color.semantic.family,
    Object.keys(EXPECTED_COLOR_SEMANTIC_KEYS.family),
    "color.semantic.family",
  );
  ensureExactKeys(tokens.color.semantic.bg, EXPECTED_COLOR_SEMANTIC_KEYS.bg, "color.semantic.bg");
  ensureExactKeys(tokens.color.semantic.text, EXPECTED_COLOR_SEMANTIC_KEYS.text, "color.semantic.text");
  ensureExactKeys(tokens.color.semantic.border, EXPECTED_COLOR_SEMANTIC_KEYS.border, "color.semantic.border");
  ensureExactKeys(tokens.color.semantic.icon, EXPECTED_COLOR_SEMANTIC_KEYS.icon, "color.semantic.icon");
  ensureExactKeys(
    tokens.color.semantic.feedback,
    Object.keys(EXPECTED_COLOR_SEMANTIC_KEYS.feedback),
    "color.semantic.feedback",
  );

  for (const [familyName, expectedKeys] of Object.entries(EXPECTED_COLOR_SEMANTIC_KEYS.family)) {
    const familyTokens = tokens.color.semantic.family[familyName];
    assert(isPlainObject(familyTokens), `color.semantic.family.${familyName} must be an object.`);
    ensureExactKeys(familyTokens, expectedKeys, `color.semantic.family.${familyName}`);
    for (const [key, value] of Object.entries(familyTokens)) {
      validateColorTokenValue(value, `color.semantic.family.${familyName}.${key}`);
    }
  }

  for (const [key, value] of Object.entries(tokens.color.semantic.bg)) {
    validateTokenRef(value, `color.semantic.bg.${key}`);
  }
  for (const [key, value] of Object.entries(tokens.color.semantic.text)) {
    validateTokenRef(value, `color.semantic.text.${key}`);
  }
  for (const [key, value] of Object.entries(tokens.color.semantic.border)) {
    validateTokenRef(value, `color.semantic.border.${key}`);
  }
  for (const [key, value] of Object.entries(tokens.color.semantic.icon)) {
    validateTokenRef(value, `color.semantic.icon.${key}`);
  }

  for (const [statusName, expectedKeys] of Object.entries(EXPECTED_COLOR_SEMANTIC_KEYS.feedback)) {
    const statusTokens = tokens.color.semantic.feedback[statusName];
    assert(isPlainObject(statusTokens), `color.semantic.feedback.${statusName} must be an object.`);
    ensureExactKeys(statusTokens, expectedKeys, `color.semantic.feedback.${statusName}`);
    for (const [key, value] of Object.entries(statusTokens)) {
      validateTokenRef(value, `color.semantic.feedback.${statusName}.${key}`);
    }
  }

  validateComponentShape(tokens.color.component, EXPECTED_COLOR_SEMANTIC_KEYS.component, "color.component");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hexToRgba(hex) {
  const n = hex.replace("#", "");
  return {
    r: parseInt(n.slice(0, 2), 16) / 255,
    g: parseInt(n.slice(2, 4), 16) / 255,
    b: parseInt(n.slice(4, 6), 16) / 255,
    a: n.length === 8 ? parseInt(n.slice(6, 8), 16) / 255 : 1,
  };
}

function parseTokenRef(ref) {
  const match = /^\{([a-zA-Z0-9_.]+)\}$/.exec(ref);
  assert(match, `Invalid token reference: ${ref}.`);
  return match[1].split(".");
}

/**
 * Resolves a color token reference to { collectionName, variableName }.
 * {color.primitive.brand.500}  → { Primitives, "color/brand/500" }
 * {color.semantic.bg.canvas}   → { Semantic,   "color/bg/canvas" }
 * {color.component.badge.red.bg} → { Components, "color/badge/red/bg" }
 */
function tokenRefToTarget(ref) {
  const parts = parseTokenRef(ref);
  assert(parts[0] === "color" && parts.length >= 3, `Invalid color reference: ${ref}.`);

  if (parts[1] === "primitive") {
    return { collectionName: COLLECTIONS.PRIMITIVES, variableName: "color/" + parts.slice(2).join("/") };
  }
  if (parts[1] === "semantic") {
    return { collectionName: COLLECTIONS.SEMANTIC, variableName: "color/" + parts.slice(2).join("/") };
  }
  if (parts[1] === "component") {
    return { collectionName: COLLECTIONS.COMPONENTS, variableName: "color/" + parts.slice(2).join("/") };
  }
  throw new Error(`Unsupported color layer in reference: ${ref}.`);
}

function collectionKey(collectionName, variableName) {
  return `${collectionName}::${variableName}`;
}

function sortScopes(scopes) {
  return [].concat(scopes || []).sort();
}

function colorsEqual(a, b) {
  if (!a || !b) return false;
  return (
    Math.abs(a.r - b.r) < 0.001 &&
    Math.abs(a.g - b.g) < 0.001 &&
    Math.abs(a.b - b.b) < 0.001 &&
    Math.abs(a.a - b.a) < 0.001
  );
}

function compareVariableValues(currentValue, nextValue) {
  if (nextValue && typeof nextValue === "object" && nextValue.type === "VARIABLE_ALIAS") {
    return (
      currentValue?.type === "VARIABLE_ALIAS" && currentValue.id === nextValue.id
    );
  }
  if (nextValue && typeof nextValue === "object" && "r" in nextValue) {
    return colorsEqual(currentValue, nextValue);
  }
  return currentValue === nextValue;
}

// ---------------------------------------------------------------------------
// Definitions builders
// ---------------------------------------------------------------------------

function toColorPrimitiveDefinitions(tokens) {
  const definitions = [];

  for (const [paletteName, paletteValues] of Object.entries(tokens.color.primitive)) {
    for (const [step, value] of Object.entries(paletteValues)) {
      definitions.push({
        collectionName: COLLECTIONS.PRIMITIVES,
        name: `color/${paletteName}/${step}`,
        resolvedType: "COLOR",
        scopes: COLOR_SCOPES,
        value: { kind: "RAW", value: hexToRgba(value) },
      });
    }
  }

  return definitions;
}

function collectSemanticDefinitions(node, pathParts, definitions) {
  for (const [key, value] of Object.entries(node)) {
    const nextPathParts = [...pathParts, key];

    if (isPlainObject(value)) {
      collectSemanticDefinitions(value, nextPathParts, definitions);
      continue;
    }

    if (isHexColor(value)) {
      definitions.push({
        collectionName: COLLECTIONS.SEMANTIC,
        name: `color/${nextPathParts.join("/")}`,
        resolvedType: "COLOR",
        scopes: COLOR_SCOPES,
        value: { kind: "RAW", value: hexToRgba(value) },
      });
      continue;
    }

    const target = tokenRefToTarget(value);
    definitions.push({
      collectionName: COLLECTIONS.SEMANTIC,
      name: `color/${nextPathParts.join("/")}`,
      resolvedType: "COLOR",
      scopes: COLOR_SCOPES,
      value: { kind: "ALIAS", targetCollectionName: target.collectionName, targetName: target.variableName },
    });
  }
}

function toColorSemanticDefinitions(tokens) {
  const definitions = [];
  collectSemanticDefinitions(tokens.color.semantic, [], definitions);
  return definitions;
}

function collectComponentDefinitions(node, pathParts, definitions) {
  for (const [key, value] of Object.entries(node)) {
    const nextPathParts = [...pathParts, key];

    if (isPlainObject(value)) {
      collectComponentDefinitions(value, nextPathParts, definitions);
      continue;
    }

    if (isHexColor(value)) {
      definitions.push({
        collectionName: COLLECTIONS.COMPONENTS,
        name: `color/${nextPathParts.join("/")}`,
        resolvedType: "COLOR",
        scopes: COLOR_SCOPES,
        value: { kind: "RAW", value: hexToRgba(value) },
      });
      continue;
    }

    const target = tokenRefToTarget(value);
    definitions.push({
      collectionName: COLLECTIONS.COMPONENTS,
      name: `color/${nextPathParts.join("/")}`,
      resolvedType: "COLOR",
      scopes: COLOR_SCOPES,
      value: { kind: "ALIAS", targetCollectionName: target.collectionName, targetName: target.variableName },
    });
  }
}

function toColorComponentDefinitions(tokens) {
  const definitions = [];
  collectComponentDefinitions(tokens.color.component, [], definitions);
  return definitions;
}

// ---------------------------------------------------------------------------
// Figma API helpers
// ---------------------------------------------------------------------------

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
  validateColorTokens(tokens);
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

async function ensureCollections(existingCollections, collectionNames) {
  const collectionMap = new Map(existingCollections.map((c) => [c.name, c]));
  const missingNames = collectionNames.filter((name) => !collectionMap.has(name));

  if (missingNames.length > 0) {
    const variableCollections = [];
    const variableModes = [];

    for (const collectionName of missingNames) {
      const tempCollectionId = `tmp_collection_${collectionName.toLowerCase()}`;
      const tempModeId = `tmp_mode_${collectionName.toLowerCase()}`;

      variableCollections.push({
        action: "CREATE",
        id: tempCollectionId,
        name: collectionName,
        initialModeId: tempModeId,
      });
      variableModes.push({
        action: "UPDATE",
        id: tempModeId,
        name: DEFAULT_MODE_NAME,
        variableCollectionId: tempCollectionId,
      });
    }

    const result = await figmaRequest("POST", `/files/${FIGMA_FILE_KEY}/variables`, {
      variableCollections,
      variableModes,
    });

    const tempIdToRealId = result?.meta?.tempIdToRealId ?? result?.tempIdToRealId ?? {};

    for (const collectionName of missingNames) {
      const tempCollectionId = `tmp_collection_${collectionName.toLowerCase()}`;
      const tempModeId = `tmp_mode_${collectionName.toLowerCase()}`;

      collectionMap.set(collectionName, {
        id: tempIdToRealId[tempCollectionId],
        name: collectionName,
        defaultModeId: tempIdToRealId[tempModeId],
        modes: [{ modeId: tempIdToRealId[tempModeId], name: DEFAULT_MODE_NAME }],
      });
    }
  }

  const resolvedCollections = {};

  for (const collectionName of collectionNames) {
    const collection = collectionMap.get(collectionName);
    assert(collection, `Missing variable collection ${collectionName}.`);

    const modeId = collection.defaultModeId || (collection.modes[0] ? collection.modes[0].modeId : null);
    assert(modeId, `Collection ${collectionName} must have at least one mode.`);

    resolvedCollections[collectionName] = { collectionId: collection.id, modeId };
  }

  return resolvedCollections;
}

function buildExistingVariableMap(existingVariables, collectionsByName) {
  const collectionNameById = new Map(
    Object.entries(collectionsByName).map(([name, meta]) => [meta.collectionId, name]),
  );

  return new Map(
    existingVariables.map((variable) => [
      collectionKey(collectionNameById.get(variable.variableCollectionId), variable.name),
      variable,
    ]),
  );
}

/**
 * Builds the sync payload for all definitions across multiple collections.
 * Handles cross-collection aliases (component → semantic → primitive).
 */
function buildSyncPayload(definitions, collectionsByName, existingVariables) {
  const existingVariableMap = buildExistingVariableMap(existingVariables, collectionsByName);
  const definitionIdMap = new Map();
  const variables = [];
  const variableModeValues = [];

  // Pass 1 — create or update variable metadata
  for (const definition of definitions) {
    const key = collectionKey(definition.collectionName, definition.name);
    const existingVariable = existingVariableMap.get(key);

    if (existingVariable) {
      assert(
        existingVariable.resolvedType === definition.resolvedType,
        `Variable ${definition.name} in ${definition.collectionName} already exists with type ${existingVariable.resolvedType}, expected ${definition.resolvedType}.`,
      );

      definitionIdMap.set(key, existingVariable.id);

      const existingScopes = sortScopes(existingVariable.scopes);
      const nextScopes = sortScopes(definition.scopes);

      if (JSON.stringify(existingScopes) !== JSON.stringify(nextScopes)) {
        variables.push({ action: "UPDATE", id: existingVariable.id, scopes: nextScopes });
      }

      continue;
    }

    const tempVariableId = `tmp_${definition.collectionName.toLowerCase()}_${definition.name.replace(/\//g, "_")}`;
    definitionIdMap.set(key, tempVariableId);
    variables.push({
      action: "CREATE",
      id: tempVariableId,
      name: definition.name,
      variableCollectionId: collectionsByName[definition.collectionName].collectionId,
      resolvedType: definition.resolvedType,
      scopes: definition.scopes,
    });
  }

  // Pass 2 — set values (after all IDs are registered, so aliases can resolve cross-collection)
  for (const definition of definitions) {
    const key = collectionKey(definition.collectionName, definition.name);
    const variableId = definitionIdMap.get(key);
    const modeId = collectionsByName[definition.collectionName].modeId;
    const existingVariable = existingVariableMap.get(key);

    let nextValue;

    if (definition.value.kind === "ALIAS") {
      const targetKey = collectionKey(definition.value.targetCollectionName, definition.value.targetName);
      const targetId = definitionIdMap.get(targetKey);
      assert(
        targetId,
        `Missing alias target "${definition.value.targetName}" (in ${definition.value.targetCollectionName}) for variable "${definition.name}".`,
      );
      nextValue = { type: "VARIABLE_ALIAS", id: targetId };
    } else {
      nextValue = definition.value.value;
    }

    if (!existingVariable || !compareVariableValues(existingVariable.valuesByMode?.[modeId], nextValue)) {
      variableModeValues.push({ variableId, modeId, value: nextValue });
    }
  }

  return { variables, variableModeValues };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function syncColorVariables() {
  const tokens = await loadTokens();
  const primitiveDefinitions = toColorPrimitiveDefinitions(tokens);
  const semanticDefinitions = toColorSemanticDefinitions(tokens);
  const componentDefinitions = toColorComponentDefinitions(tokens);
  const definitions = [...primitiveDefinitions, ...semanticDefinitions, ...componentDefinitions];

  if (process.argv.includes("--validate")) {
    console.log(
      `Validated ${primitiveDefinitions.length} primitive, ${semanticDefinitions.length} semantic, and ${componentDefinitions.length} component color variables from ${TOKENS_PATH}.`,
    );
    return;
  }

  assert(FIGMA_ACCESS_TOKEN, "Missing FIGMA_ACCESS_TOKEN environment variable.");
  assert(FIGMA_FILE_KEY, "Missing FIGMA_FILE_KEY environment variable.");

  const localVariablesPayload = await getLocalVariables();
  const collections = getCollections(localVariablesPayload);
  const variables = getVariables(localVariablesPayload);
  const collectionsByName = await ensureCollections(collections, [
    COLLECTIONS.PRIMITIVES,
    COLLECTIONS.SEMANTIC,
    COLLECTIONS.COMPONENTS,
  ]);

  const existingVariables = variables.filter((variable) =>
    Object.values(collectionsByName).some((meta) => meta.collectionId === variable.variableCollectionId),
  );

  const payload = buildSyncPayload(definitions, collectionsByName, existingVariables);

  if (payload.variables.length === 0 && payload.variableModeValues.length === 0) {
    console.log("Color variables are already in sync.");
    return;
  }

  await figmaRequest("POST", `/files/${FIGMA_FILE_KEY}/variables`, payload);

  console.log(
    `Synced ${primitiveDefinitions.length} primitive variables to "${COLLECTIONS.PRIMITIVES}", ${semanticDefinitions.length} semantic variables to "${COLLECTIONS.SEMANTIC}", and ${componentDefinitions.length} component variables to "${COLLECTIONS.COMPONENTS}".`,
  );
}

syncColorVariables().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
