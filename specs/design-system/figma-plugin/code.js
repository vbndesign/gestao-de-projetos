const COLLECTIONS = {
  PRIMITIVES: "Primitives",
  SEMANTIC: "Semantic",
};
const DEFAULT_MODE_NAME = "Default";
const BASELINE_GRID = 4;
const TEXT_STYLE_PREFIX = "Typography";

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

figma.showUI(__html__, {
  width: 520,
  height: 680,
  themeColors: true,
});

figma.ui.onmessage = async (message) => {
  try {
    if (message.type === "IMPORT_TYPOGRAPHY") {
      const tokens = JSON.parse(message.payload);
      validateTypographyTokens(tokens);
      const summary = await syncTypography(tokens);

      figma.ui.postMessage({
        type: "IMPORT_SUCCESS",
        summary,
      });
      figma.notify(
        `Typography import complete: ${summary.primitiveCount} primitive variables, ${summary.semanticCount} semantic variables, ${summary.textStyleCount} text styles.`,
      );
      return;
    }

    if (message.type === "CLOSE_PLUGIN") {
      figma.closePlugin();
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    figma.ui.postMessage({
      type: "IMPORT_ERROR",
      error: errorMessage,
    });
    figma.notify(errorMessage, { error: true });
  }
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

function styleKey(groupKey, tokenKey) {
  return `${groupKey}::${tokenKey}`;
}

function sortScopes(scopes) {
  return [].concat(scopes || []).sort();
}

function resolveTokenRef(tokens, ref) {
  const path = tokenRefToVariableName(ref).split("/");
  let current = tokens;

  for (const segment of path) {
    current = current[segment];
  }

  return current;
}

function getTextStyleName(groupKey, tokenKey) {
  if (groupKey === "body") {
    const bodyNames = {
      sm: "Body/Small",
      md: "Body/Default",
      lg: "Body/Large",
    };

    return `${TEXT_STYLE_PREFIX}/${bodyNames[tokenKey]}`;
  }

  return `${TEXT_STYLE_PREFIX}/Heading/${tokenKey.toUpperCase()}`;
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

function toTextStyleDefinitions(tokens) {
  const definitions = [];

  for (const [groupKey, groupTokens] of Object.entries(tokens.text)) {
    for (const [tokenKey, tokenValues] of Object.entries(groupTokens)) {
      definitions.push({
        name: getTextStyleName(groupKey, tokenKey),
        fontFamilyRef: "font/family/primary",
        sizeRef: `text/${groupKey}/${tokenKey}/size`,
        lineHeightRef: `text/${groupKey}/${tokenKey}/lineHeight`,
        weightRef: `text/${groupKey}/${tokenKey}/weight`,
        fallbackFamily: tokens.font.family.primary,
        fallbackSize: resolveTokenRef(tokens, tokenValues.size),
        fallbackLineHeight: resolveTokenRef(tokens, tokenValues.lineHeight),
      });
    }
  }

  return definitions;
}

async function getOrCreateCollections(collectionNames) {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const collectionMap = new Map(collections.map((collection) => [collection.name, collection]));

  for (const collectionName of collectionNames) {
    if (collectionMap.has(collectionName)) {
      continue;
    }

    const collection = figma.variables.createVariableCollection(collectionName);
    const defaultMode = collection.modes.find((mode) => mode.name === DEFAULT_MODE_NAME);

    if (defaultMode == null && collection.modes.length > 0) {
      collection.renameMode(collection.modes[0].modeId, DEFAULT_MODE_NAME);
    }

    collectionMap.set(collectionName, collection);
  }

  const resolvedCollections = {};

  for (const collectionName of collectionNames) {
    const collection = collectionMap.get(collectionName);
    assert(collection, `Missing collection ${collectionName}.`);

    resolvedCollections[collectionName] = {
      collection,
      modeId: collection.defaultModeId || (collection.modes[0] ? collection.modes[0].modeId : null),
    };

    assert(resolvedCollections[collectionName].modeId, `Collection ${collectionName} must have one mode.`);
  }

  return resolvedCollections;
}

async function getExistingVariables(collectionsByName) {
  const variables = [];

  for (const collectionInfo of Object.values(collectionsByName)) {
    for (const variableId of collectionInfo.collection.variableIds) {
      const variable = await figma.variables.getVariableByIdAsync(variableId);

      if (variable) {
        variables.push(variable);
      }
    }
  }

  return variables;
}

function buildExistingVariableMap(existingVariables, collectionsByName) {
  const collectionNameById = new Map(
    Object.entries(collectionsByName).map(([collectionName, value]) => [value.collection.id, collectionName]),
  );

  return new Map(
    existingVariables.map((variable) => [
      collectionKey(collectionNameById.get(variable.variableCollectionId), variable.name),
      variable,
    ]),
  );
}

function removeObsoleteSemanticFamilyVariables(existingVariables, collectionsByName) {
  const semanticCollectionId = collectionsByName[COLLECTIONS.SEMANTIC].collection.id;
  const familyPattern = /^text\/(body|heading)\/[^/]+\/family$/;
  let removedCount = 0;

  for (const variable of existingVariables) {
    if (variable.variableCollectionId !== semanticCollectionId) {
      continue;
    }

    if (!familyPattern.test(variable.name)) {
      continue;
    }

    if (typeof variable.remove === "function") {
      variable.remove();
      removedCount += 1;
    }
  }

  return removedCount;
}

function getOrCreateVariable(definition, collectionsByName, existingVariableMap) {
  const key = collectionKey(definition.collectionName, definition.name);
  const existingVariable = existingVariableMap.get(key);

  if (existingVariable) {
    assert(
      existingVariable.resolvedType === definition.resolvedType,
      `Variable ${definition.name} already exists in ${definition.collectionName} with type ${existingVariable.resolvedType}, expected ${definition.resolvedType}.`,
    );

    const nextScopes = sortScopes(definition.scopes);
    const currentScopes = sortScopes(existingVariable.scopes);

    if (JSON.stringify(nextScopes) !== JSON.stringify(currentScopes)) {
      existingVariable.scopes = nextScopes;
    }

    return existingVariable;
  }

  const collection = collectionsByName[definition.collectionName].collection;
  const variable = figma.variables.createVariable(definition.name, collection, definition.resolvedType);

  if (definition.scopes) {
    variable.scopes = definition.scopes;
  }

  existingVariableMap.set(key, variable);
  return variable;
}

async function getOrCreateTextStyles() {
  const styles = await figma.getLocalTextStylesAsync();
  return new Map(styles.map((style) => [style.name, style]));
}

function getOrCreateTextStyle(styleDefinition, existingStyleMap) {
  if (existingStyleMap.has(styleDefinition.name)) {
    return existingStyleMap.get(styleDefinition.name);
  }

  const style = figma.createTextStyle();
  style.name = styleDefinition.name;
  existingStyleMap.set(styleDefinition.name, style);
  return style;
}

async function syncTextStyles(styleDefinitions, syncedVariables) {
  const existingStyleMap = await getOrCreateTextStyles();
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });

  for (const styleDefinition of styleDefinitions) {
    const style = getOrCreateTextStyle(styleDefinition, existingStyleMap);
    const familyVariable = syncedVariables.get(collectionKey(COLLECTIONS.PRIMITIVES, styleDefinition.fontFamilyRef));
    const sizeVariable = syncedVariables.get(collectionKey(COLLECTIONS.SEMANTIC, styleDefinition.sizeRef));
    const lineHeightVariable = syncedVariables.get(collectionKey(COLLECTIONS.SEMANTIC, styleDefinition.lineHeightRef));
    const weightVariable = syncedVariables.get(collectionKey(COLLECTIONS.SEMANTIC, styleDefinition.weightRef));

    assert(familyVariable, `Missing primitive family variable ${styleDefinition.fontFamilyRef}.`);
    assert(sizeVariable, `Missing semantic size variable ${styleDefinition.sizeRef}.`);
    assert(lineHeightVariable, `Missing semantic line-height variable ${styleDefinition.lineHeightRef}.`);
    assert(weightVariable, `Missing semantic weight variable ${styleDefinition.weightRef}.`);

    style.fontName = {
      family: styleDefinition.fallbackFamily,
      style: "Regular",
    };
    style.fontSize = styleDefinition.fallbackSize;
    style.lineHeight = {
      unit: "PIXELS",
      value: styleDefinition.fallbackLineHeight,
    };
    style.setBoundVariable("fontFamily", familyVariable);
    style.setBoundVariable("fontSize", sizeVariable);
    style.setBoundVariable("lineHeight", lineHeightVariable);
    style.setBoundVariable("fontWeight", weightVariable);
    style.description = "Generated from typography variables.";
  }
}

async function syncTypography(tokens) {
  const primitiveDefinitions = toPrimitiveDefinitions(tokens);
  const semanticDefinitions = toSemanticDefinitions(tokens);
  const textStyleDefinitions = toTextStyleDefinitions(tokens);
  const definitions = primitiveDefinitions.concat(semanticDefinitions);
  const collectionsByName = await getOrCreateCollections([COLLECTIONS.PRIMITIVES, COLLECTIONS.SEMANTIC]);
  const existingVariables = await getExistingVariables(collectionsByName);
  const removedObsoleteCount = removeObsoleteSemanticFamilyVariables(existingVariables, collectionsByName);
  const refreshedExistingVariables = removedObsoleteCount > 0 ? await getExistingVariables(collectionsByName) : existingVariables;
  const existingVariableMap = buildExistingVariableMap(refreshedExistingVariables, collectionsByName);
  const syncedVariables = new Map();

  for (const definition of definitions) {
    const variable = getOrCreateVariable(definition, collectionsByName, existingVariableMap);
    syncedVariables.set(collectionKey(definition.collectionName, definition.name), variable);
  }

  for (const definition of definitions) {
    const variable = syncedVariables.get(collectionKey(definition.collectionName, definition.name));
    const modeId = collectionsByName[definition.collectionName].modeId;

    if (definition.value.kind === "ALIAS") {
      const targetVariable = syncedVariables.get(collectionKey(COLLECTIONS.PRIMITIVES, definition.value.targetName));
      assert(targetVariable, `Missing primitive target ${definition.value.targetName}.`);
      variable.setValueForMode(modeId, figma.variables.createVariableAlias(targetVariable));
    } else {
      variable.setValueForMode(modeId, definition.value.value);
    }
  }

  await syncTextStyles(textStyleDefinitions, syncedVariables);

  return {
    primitiveCount: primitiveDefinitions.length,
    semanticCount: semanticDefinitions.length,
    textStyleCount: textStyleDefinitions.length,
    presetCount: Object.keys(tokens.text.body).length + Object.keys(tokens.text.heading).length,
    removedObsoleteCount,
  };
}

