import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOKENS_PATH = path.resolve(__dirname, "../tokens/typography.json");
const FIGMA_API_BASE = process.env.FIGMA_API_BASE ?? "https://api.figma.com/v1";
const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN;
const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY;
const COLLECTIONS = {
  PRIMITIVES: "Primitives",
  SEMANTIC: "Semantic",
};
const DEFAULT_MODE_NAME = "Default";
const BASELINE_GRID = 4;

const ALLOWED_FONT_SIZES = {
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  h6: 20,
  h5: 24,
  h4: 28,
  h3: 32,
  h2: 40,
  h1: 48,
};

const ALLOWED_LINE_HEIGHTS = {
  sm: 24,
  base: 24,
  lg: 28,
  xl: 32,
  h6: 28,
  h5: 32,
  h4: 36,
  h3: 40,
  h2: 48,
  h1: 56,
};

const ALLOWED_FONT_WEIGHTS = {
  regular: 400,
  semibold: 600,
  bold: 700,
};

const EXPECTED_SEMANTIC_TEXT_TOKENS = {
  body: {
    sm: {
      size: "{font.size.sm}",
      lineHeight: "{font.lineHeight.sm}",
      weight: "{font.weight.regular}",
    },
    md: {
      size: "{font.size.base}",
      lineHeight: "{font.lineHeight.base}",
      weight: "{font.weight.regular}",
    },
    lg: {
      size: "{font.size.lg}",
      lineHeight: "{font.lineHeight.lg}",
      weight: "{font.weight.regular}",
    },
  },
  heading: {
    h1: {
      size: "{font.size.h1}",
      lineHeight: "{font.lineHeight.h1}",
      weight: "{font.weight.semibold}",
    },
    h2: {
      size: "{font.size.h2}",
      lineHeight: "{font.lineHeight.h2}",
      weight: "{font.weight.semibold}",
    },
    h3: {
      size: "{font.size.h3}",
      lineHeight: "{font.lineHeight.h3}",
      weight: "{font.weight.semibold}",
    },
    h4: {
      size: "{font.size.h4}",
      lineHeight: "{font.lineHeight.h4}",
      weight: "{font.weight.semibold}",
    },
    h5: {
      size: "{font.size.h5}",
      lineHeight: "{font.lineHeight.h5}",
      weight: "{font.weight.semibold}",
    },
    h6: {
      size: "{font.size.h6}",
      lineHeight: "{font.lineHeight.h6}",
      weight: "{font.weight.semibold}",
    },
  },
};

const SEMANTIC_PROPERTY_CONFIG = {
  size: {
    resolvedType: "FLOAT",
    scopes: ["FONT_SIZE"],
  },
  lineHeight: {
    resolvedType: "FLOAT",
    scopes: ["LINE_HEIGHT"],
  },
  weight: {
    resolvedType: "FLOAT",
    scopes: ["FONT_WEIGHT"],
  },
};

const PRIMITIVE_SCOPE_CONFIG = {
  size: ["FONT_SIZE"],
  lineHeight: ["LINE_HEIGHT"],
  weight: ["FONT_WEIGHT"],
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function ensureExactEntries(actual, expected, label) {
  const actualKeys = Object.keys(actual).sort();
  const expectedKeys = Object.keys(expected).sort();

  assert(
    JSON.stringify(actualKeys) === JSON.stringify(expectedKeys),
    `${label} must contain exactly: ${expectedKeys.join(", ")}.`,
  );

  for (const [key, value] of Object.entries(expected)) {
    assert(actual[key] === value, `${label}.${key} must be ${value}.`);
  }
}

function ensureExactShape(actual, expected, label) {
  assert(actual && typeof actual === "object", `${label} must be an object.`);

  const actualKeys = Object.keys(actual).sort();
  const expectedKeys = Object.keys(expected).sort();

  assert(
    JSON.stringify(actualKeys) === JSON.stringify(expectedKeys),
    `${label} must contain exactly: ${expectedKeys.join(", ")}.`,
  );

  for (const [key, value] of Object.entries(expected)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      ensureExactShape(actual[key], value, `${label}.${key}`);
      continue;
    }

    assert(actual[key] === value, `${label}.${key} must be ${value}.`);
  }
}

function validateTypographyTokens(tokens) {
  assert(tokens && typeof tokens === "object", "Token file must export an object.");
  assert(tokens.font && typeof tokens.font === "object", "Missing top-level font object.");
  assert(tokens.font.family && typeof tokens.font.family === "object", "Missing font.family.");
  assert(tokens.font.size && typeof tokens.font.size === "object", "Missing font.size.");
  assert(tokens.font.lineHeight && typeof tokens.font.lineHeight === "object", "Missing font.lineHeight.");
  assert(tokens.font.weight && typeof tokens.font.weight === "object", "Missing font.weight.");
  assert(tokens.text && typeof tokens.text === "object", "Missing top-level text object.");
  assert(tokens.text.body && typeof tokens.text.body === "object", "Missing text.body.");
  assert(tokens.text.heading && typeof tokens.text.heading === "object", "Missing text.heading.");

  assert(tokens.font.family.primary === "Inter", "font.family.primary must remain Inter.");

  ensureExactEntries(tokens.font.size, ALLOWED_FONT_SIZES, "font.size");
  ensureExactEntries(tokens.font.lineHeight, ALLOWED_LINE_HEIGHTS, "font.lineHeight");
  ensureExactEntries(tokens.font.weight, ALLOWED_FONT_WEIGHTS, "font.weight");
  ensureExactShape(tokens.text, EXPECTED_SEMANTIC_TEXT_TOKENS, "text");

  for (const [key, value] of Object.entries(tokens.font.lineHeight)) {
    assert(Number.isInteger(value), `font.lineHeight.${key} must be an integer.`);
    assert(value % BASELINE_GRID === 0, `font.lineHeight.${key} must be a multiple of ${BASELINE_GRID}.`);
  }
}

function tokenRefToVariableName(ref) {
  const match = /^\{([a-zA-Z0-9_.]+)\}$/.exec(ref);
  assert(match, `Invalid token reference: ${ref}.`);
  return match[1].split(".").join("/");
}

function collectionKey(collectionName, variableName) {
  return `${collectionName}::${variableName}`;
}

function sortScopes(scopes) {
  return [].concat(scopes || []).sort();
}

function toPrimitiveDefinitions(tokens) {
  return [
    {
      collectionName: COLLECTIONS.PRIMITIVES,
      name: "font/family/primary",
      resolvedType: "STRING",
      value: {
        kind: "RAW",
        value: tokens.font.family.primary,
      },
    },
    ...Object.entries(tokens.font.size).map(([key, value]) => ({
      collectionName: COLLECTIONS.PRIMITIVES,
      name: `font/size/${key}`,
      resolvedType: "FLOAT",
      scopes: PRIMITIVE_SCOPE_CONFIG.size,
      value: {
        kind: "RAW",
        value,
      },
    })),
    ...Object.entries(tokens.font.lineHeight).map(([key, value]) => ({
      collectionName: COLLECTIONS.PRIMITIVES,
      name: `font/lineHeight/${key}`,
      resolvedType: "FLOAT",
      scopes: PRIMITIVE_SCOPE_CONFIG.lineHeight,
      value: {
        kind: "RAW",
        value,
      },
    })),
    ...Object.entries(tokens.font.weight).map(([key, value]) => ({
      collectionName: COLLECTIONS.PRIMITIVES,
      name: `font/weight/${key}`,
      resolvedType: "FLOAT",
      scopes: PRIMITIVE_SCOPE_CONFIG.weight,
      value: {
        kind: "RAW",
        value,
      },
    })),
  ];
}

function toSemanticDefinitions(tokens) {
  const definitions = [];

  for (const [groupKey, groupTokens] of Object.entries(tokens.text)) {
    for (const [tokenKey, tokenValues] of Object.entries(groupTokens)) {
      for (const [propertyKey, propertyConfig] of Object.entries(SEMANTIC_PROPERTY_CONFIG)) {
        definitions.push({
          collectionName: COLLECTIONS.SEMANTIC,
          name: `text/${groupKey}/${tokenKey}/${propertyKey}`,
          resolvedType: propertyConfig.resolvedType,
          scopes: propertyConfig.scopes,
          value: {
            kind: "ALIAS",
            targetName: tokenRefToVariableName(tokenValues[propertyKey]),
          },
        });
      }
    }
  }

  return definitions;
}

function compareVariableValues(currentValue, nextValue) {
  if (nextValue && typeof nextValue === "object" && nextValue.type === "VARIABLE_ALIAS") {
    return (
      currentValue &&
      typeof currentValue === "object" &&
      currentValue.type === "VARIABLE_ALIAS" &&
      currentValue.id === nextValue.id
    );
  }

  return currentValue === nextValue;
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

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function loadTokens() {
  const raw = await readFile(TOKENS_PATH, "utf8");
  const tokens = JSON.parse(raw);
  validateTypographyTokens(tokens);
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
  const collectionMap = new Map(existingCollections.map((collection) => [collection.name, collection]));
  const missingCollectionNames = collectionNames.filter((name) => !collectionMap.has(name));

  if (missingCollectionNames.length > 0) {
    const variableCollections = [];
    const variableModes = [];

    for (const collectionName of missingCollectionNames) {
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

    for (const collectionName of missingCollectionNames) {
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

    resolvedCollections[collectionName] = {
      collectionId: collection.id,
      modeId: collection.defaultModeId || (collection.modes[0] ? collection.modes[0].modeId : null),
    };

    assert(resolvedCollections[collectionName].modeId, `Collection ${collectionName} must have at least one mode.`);
  }

  return resolvedCollections;
}

function buildExistingVariableMap(existingVariables, collectionsByName) {
  const collectionNameById = new Map(
    Object.entries(collectionsByName).map(([collectionName, collection]) => [collection.collectionId, collectionName]),
  );

  return new Map(
    existingVariables.map((variable) => [
      collectionKey(collectionNameById.get(variable.variableCollectionId), variable.name),
      variable,
    ]),
  );
}

function buildSyncPayload(definitions, collectionsByName, existingVariables) {
  const existingVariableMap = buildExistingVariableMap(existingVariables, collectionsByName);
  const definitionIdMap = new Map();
  const variables = [];
  const variableModeValues = [];

  for (const definition of definitions) {
    const key = collectionKey(definition.collectionName, definition.name);
    const existingVariable = existingVariableMap.get(key);

    if (existingVariable) {
      assert(
        existingVariable.resolvedType === definition.resolvedType,
        `Variable ${definition.name} already exists in ${definition.collectionName} with type ${existingVariable.resolvedType}, expected ${definition.resolvedType}.`,
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

    const tempVariableId = `tmp_${definition.collectionName.toLowerCase()}_${definition.name.replace(/\//g, "_")}`;
    definitionIdMap.set(key, tempVariableId);
    variables.push({
      action: "CREATE",
      id: tempVariableId,
      name: definition.name,
      variableCollectionId: collectionsByName[definition.collectionName].collectionId,
      resolvedType: definition.resolvedType,
      ...(definition.scopes ? { scopes: definition.scopes } : {}),
    });
  }

  for (const definition of definitions) {
    const key = collectionKey(definition.collectionName, definition.name);
    const variableId = definitionIdMap.get(key);
    const modeId = collectionsByName[definition.collectionName].modeId;
    const existingVariable = existingVariableMap.get(key);

    let nextValue;

    if (definition.value.kind === "ALIAS") {
      const targetKey = collectionKey(COLLECTIONS.PRIMITIVES, definition.value.targetName);
      const targetId = definitionIdMap.get(targetKey);
      assert(targetId, `Missing primitive target ${definition.value.targetName} for semantic variable ${definition.name}.`);
      nextValue = {
        type: "VARIABLE_ALIAS",
        id: targetId,
      };
    } else {
      nextValue = definition.value.value;
    }

    if (!existingVariable || !compareVariableValues(existingVariable.valuesByMode?.[modeId], nextValue)) {
      variableModeValues.push({
        variableId,
        modeId,
        value: nextValue,
      });
    }
  }

  return { variables, variableModeValues };
}

async function syncTypographyVariables() {
  const tokens = await loadTokens();
  const primitiveDefinitions = toPrimitiveDefinitions(tokens);
  const semanticDefinitions = toSemanticDefinitions(tokens);
  const definitions = [...primitiveDefinitions, ...semanticDefinitions];
  const semanticPresetCount = Object.keys(tokens.text.body).length + Object.keys(tokens.text.heading).length;

  if (process.argv.includes("--validate")) {
    console.log(
      `Validated ${primitiveDefinitions.length} primitive variables, ${semanticDefinitions.length} semantic variables, and ${semanticPresetCount} semantic typography presets from ${TOKENS_PATH}.`,
    );
    return;
  }

  assert(FIGMA_ACCESS_TOKEN, "Missing FIGMA_ACCESS_TOKEN environment variable.");
  assert(FIGMA_FILE_KEY, "Missing FIGMA_FILE_KEY environment variable.");

  const localVariablesPayload = await getLocalVariables();
  const collections = getCollections(localVariablesPayload);
  const variables = getVariables(localVariablesPayload);
  const collectionsByName = await ensureCollections(collections, [COLLECTIONS.PRIMITIVES, COLLECTIONS.SEMANTIC]);

  const existingVariables = variables.filter((variable) =>
    Object.values(collectionsByName).some((collection) => collection.collectionId === variable.variableCollectionId),
  );

  const payload = buildSyncPayload(definitions, collectionsByName, existingVariables);

  if (payload.variables.length === 0 && payload.variableModeValues.length === 0) {
    console.log("Typography variables are already in sync.");
    return;
  }

  await figmaRequest("POST", `/files/${FIGMA_FILE_KEY}/variables`, payload);

  console.log(
    `Synced ${primitiveDefinitions.length} primitive variables to \"${COLLECTIONS.PRIMITIVES}\" and ${semanticDefinitions.length} semantic variables to \"${COLLECTIONS.SEMANTIC}\".`,
  );
}

syncTypographyVariables().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
