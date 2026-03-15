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
        },
        neutral: {
          default: ["bg", "text", "icon"],
          hover: ["bg", "text", "icon"],
        },
      },
      outline: {
        brand: {
          default: ["bg", "text", "icon", "border"],
          hover: ["bg", "text", "icon", "border"],
        },
        neutral: {
          default: ["bg", "text", "icon", "border"],
          hover: ["bg", "text", "icon", "border"],
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
    dataRow: {
      header: ["bg", "text"],
      default: ["bg", "border", "title"],
      hover: ["bg", "border", "title"],
      actionIcon: {
        default: ["bg", "icon"],
        hover: ["bg", "icon"],
      },
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

const COLOR_SCOPES = ["ALL_SCOPES"];

figma.showUI(__html__, {
  width: 560,
  height: 720,
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
        domain: "typography",
        summary: summary,
      });
      figma.notify(
        "Typography import complete: " +
          summary.primitiveCount +
          " primitive variables, " +
          summary.semanticCount +
          " semantic variables, " +
          summary.textStyleCount +
          " text styles.",
      );
      return;
    }

    if (message.type === "IMPORT_COLORS") {
      const tokens = JSON.parse(message.payload);
      validateColorTokens(tokens);
      const summary = await syncColors(tokens);

      figma.ui.postMessage({
        type: "IMPORT_SUCCESS",
        domain: "colors",
        summary: summary,
      });
      figma.notify(
        "Color import complete: " +
          summary.primitiveCount +
          " primitive variables, " +
          summary.semanticCount +
          " semantic variables.",
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

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function ensureExactEntries(actual, expected, label) {
  const actualKeys = Object.keys(actual).sort();
  const expectedKeys = Object.keys(expected).sort();

  assert(
    JSON.stringify(actualKeys) === JSON.stringify(expectedKeys),
    label + " must contain exactly: " + expectedKeys.join(", ") + ".",
  );

  Object.entries(expected).forEach(function (entry) {
    const key = entry[0];
    const value = entry[1];
    assert(actual[key] === value, label + "." + key + " must be " + value + ".");
  });
}

function ensureExactShape(actual, expected, label) {
  assert(isPlainObject(actual), label + " must be an object.");

  const actualKeys = Object.keys(actual).sort();
  const expectedKeys = Object.keys(expected).sort();

  assert(
    JSON.stringify(actualKeys) === JSON.stringify(expectedKeys),
    label + " must contain exactly: " + expectedKeys.join(", ") + ".",
  );

  Object.entries(expected).forEach(function (entry) {
    const key = entry[0];
    const value = entry[1];

    if (isPlainObject(value)) {
      ensureExactShape(actual[key], value, label + "." + key);
      return;
    }

    assert(actual[key] === value, label + "." + key + " must be " + value + ".");
  });
}

function ensureExactKeys(actual, expectedKeys, label) {
  const actualKeys = Object.keys(actual).sort();
  const sortedExpectedKeys = expectedKeys.slice().sort();

  assert(
    JSON.stringify(actualKeys) === JSON.stringify(sortedExpectedKeys),
    label + " must contain exactly: " + sortedExpectedKeys.join(", ") + ".",
  );
}

function validateTypographyTokens(tokens) {
  assert(isPlainObject(tokens), "Token file must export an object.");
  assert(isPlainObject(tokens.font), "Missing top-level font object.");
  assert(isPlainObject(tokens.font.family), "Missing font.family.");
  assert(isPlainObject(tokens.font.size), "Missing font.size.");
  assert(isPlainObject(tokens.font.lineHeight), "Missing font.lineHeight.");
  assert(isPlainObject(tokens.font.weight), "Missing font.weight.");
  assert(isPlainObject(tokens.text), "Missing top-level text object.");
  assert(isPlainObject(tokens.text.body), "Missing text.body.");
  assert(isPlainObject(tokens.text.heading), "Missing text.heading.");

  assert(tokens.font.family.primary === "Inter", "font.family.primary must remain Inter.");

  ensureExactEntries(tokens.font.size, ALLOWED_FONT_SIZES, "font.size");
  ensureExactEntries(tokens.font.lineHeight, ALLOWED_LINE_HEIGHTS, "font.lineHeight");
  ensureExactEntries(tokens.font.weight, ALLOWED_FONT_WEIGHTS, "font.weight");
  ensureExactShape(tokens.text, EXPECTED_SEMANTIC_TEXT_TOKENS, "text");

  Object.entries(tokens.font.lineHeight).forEach(function (entry) {
    const key = entry[0];
    const value = entry[1];
    assert(Number.isInteger(value), "font.lineHeight." + key + " must be an integer.");
    assert(
      value % BASELINE_GRID === 0,
      "font.lineHeight." + key + " must be a multiple of " + BASELINE_GRID + ".",
    );
  });
}

function validateHexColor(value, label) {
  assert(
    /^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(value),
    label + " must be a 6-digit or 8-digit hexadecimal color.",
  );
}

function isHexColor(value) {
  return typeof value === "string" && /^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(value);
}

function validateTokenRef(value, label, domainName) {
  const regex = new RegExp("^\\{" + domainName + "\\.(primitive|semantic)\\.[a-zA-Z0-9_.]+\\}$");
  assert(regex.test(value), label + " must be a valid " + domainName + " token reference.");
}

function validateColorTokenValue(value, label) {
  if (isHexColor(value)) {
    validateHexColor(value, label);
    return;
  }

  validateTokenRef(value, label, "color");
}

function validateComponentShape(actual, expected, label) {
  if (Array.isArray(expected)) {
    assert(isPlainObject(actual), label + " must be an object.");
    ensureExactKeys(actual, expected, label);

    expected.forEach(function (key) {
      validateColorTokenValue(actual[key], label + "." + key);
    });

    return;
  }

  assert(isPlainObject(actual), label + " must be an object.");
  ensureExactKeys(actual, Object.keys(expected), label);

  Object.entries(expected).forEach(function (entry) {
    validateComponentShape(actual[entry[0]], entry[1], label + "." + entry[0]);
  });
}

function validateColorTokens(tokens) {
  assert(isPlainObject(tokens), "Token file must export an object.");
  assert(isPlainObject(tokens.color), "Missing top-level color object.");
  assert(isPlainObject(tokens.color.primitive), "Missing color.primitive.");
  assert(isPlainObject(tokens.color.semantic), "Missing color.semantic.");

  ensureExactKeys(tokens.color.primitive, Object.keys(EXPECTED_COLOR_PRIMITIVE_KEYS), "color.primitive");

  Object.entries(EXPECTED_COLOR_PRIMITIVE_KEYS).forEach(function (entry) {
    const paletteName = entry[0];
    const expectedSteps = entry[1];
    const palette = tokens.color.primitive[paletteName];

    assert(isPlainObject(palette), "color.primitive." + paletteName + " must be an object.");
    ensureExactKeys(palette, expectedSteps, "color.primitive." + paletteName);

    Object.entries(palette).forEach(function (stepEntry) {
      validateHexColor(stepEntry[1], "color.primitive." + paletteName + "." + stepEntry[0]);
    });
  });

  ensureExactKeys(
    tokens.color.semantic,
    ["family", "bg", "text", "border", "icon", "feedback", "component"],
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

  Object.entries(EXPECTED_COLOR_SEMANTIC_KEYS.family).forEach(function (entry) {
    const familyName = entry[0];
    const expectedKeys = entry[1];
    const familyTokens = tokens.color.semantic.family[familyName];

    assert(isPlainObject(familyTokens), "color.semantic.family." + familyName + " must be an object.");
    ensureExactKeys(familyTokens, expectedKeys, "color.semantic.family." + familyName);

    Object.entries(familyTokens).forEach(function (familyEntry) {
      validateColorTokenValue(
        familyEntry[1],
        "color.semantic.family." + familyName + "." + familyEntry[0],
      );
    });
  });

  Object.entries(tokens.color.semantic.bg).forEach(function (entry) {
    validateTokenRef(entry[1], "color.semantic.bg." + entry[0], "color");
  });

  Object.entries(tokens.color.semantic.text).forEach(function (entry) {
    validateTokenRef(entry[1], "color.semantic.text." + entry[0], "color");
  });

  Object.entries(tokens.color.semantic.border).forEach(function (entry) {
    validateTokenRef(entry[1], "color.semantic.border." + entry[0], "color");
  });

  Object.entries(tokens.color.semantic.icon).forEach(function (entry) {
    validateTokenRef(entry[1], "color.semantic.icon." + entry[0], "color");
  });

  Object.entries(EXPECTED_COLOR_SEMANTIC_KEYS.feedback).forEach(function (entry) {
    const statusName = entry[0];
    const expectedKeys = entry[1];
    const statusTokens = tokens.color.semantic.feedback[statusName];

    assert(isPlainObject(statusTokens), "color.semantic.feedback." + statusName + " must be an object.");
    ensureExactKeys(statusTokens, expectedKeys, "color.semantic.feedback." + statusName);

    Object.entries(statusTokens).forEach(function (statusEntry) {
      validateTokenRef(
        statusEntry[1],
        "color.semantic.feedback." + statusName + "." + statusEntry[0],
        "color",
      );
    });
  });

  validateComponentShape(
    tokens.color.semantic.component,
    EXPECTED_COLOR_SEMANTIC_KEYS.component,
    "color.semantic.component",
  );
}

function parseTokenRef(ref) {
  const match = /^\{([a-zA-Z0-9_.]+)\}$/.exec(ref);
  assert(match, "Invalid token reference: " + ref + ".");
  return match[1].split(".");
}

function tokenRefToPath(ref) {
  return parseTokenRef(ref).join("/");
}

function tokenRefToVariableTarget(ref) {
  const parts = parseTokenRef(ref);

  if (parts[0] === "color") {
    assert(parts.length >= 4, "Invalid color reference: " + ref + ".");
    assert(parts[1] === "primitive" || parts[1] === "semantic", "Invalid color layer in " + ref + ".");

    return {
      collectionName: parts[1] === "primitive" ? COLLECTIONS.PRIMITIVES : COLLECTIONS.SEMANTIC,
      variableName: "color/" + parts.slice(2).join("/"),
    };
  }

  if (parts[0] === "font") {
    return {
      collectionName: COLLECTIONS.PRIMITIVES,
      variableName: parts.join("/"),
    };
  }

  if (parts[0] === "text") {
    return {
      collectionName: COLLECTIONS.SEMANTIC,
      variableName: parts.join("/"),
    };
  }

  throw new Error("Unsupported token reference: " + ref + ".");
}

function collectionKey(collectionName, variableName) {
  return collectionName + "::" + variableName;
}

function sortScopes(scopes) {
  return [].concat(scopes || []).sort();
}

function resolveTokenRef(tokens, ref) {
  const path = tokenRefToPath(ref).split("/");
  let current = tokens;

  path.forEach(function (segment) {
    current = current[segment];
  });

  return current;
}

function hexToRgba(hex) {
  const normalized = hex.replace("#", "");
  const red = parseInt(normalized.slice(0, 2), 16) / 255;
  const green = parseInt(normalized.slice(2, 4), 16) / 255;
  const blue = parseInt(normalized.slice(4, 6), 16) / 255;
  const alpha = normalized.length === 8 ? parseInt(normalized.slice(6, 8), 16) / 255 : 1;

  return {
    r: red,
    g: green,
    b: blue,
    a: alpha,
  };
}

function getTextStyleName(groupKey, tokenKey, weightSuffix) {
  if (groupKey === "body") {
    const bodyNames = {
      sm: "Body/Small",
      md: "Body/Default",
      lg: "Body/Large",
    };

    return TEXT_STYLE_PREFIX + "/" + bodyNames[tokenKey] + weightSuffix;
  }

  return TEXT_STYLE_PREFIX + "/Heading/" + tokenKey.toUpperCase();
}

function toTypographyPrimitiveDefinitions(tokens) {
  const definitions = [
    {
      collectionName: COLLECTIONS.PRIMITIVES,
      name: "font/family/primary",
      resolvedType: "STRING",
      value: {
        kind: "RAW",
        value: tokens.font.family.primary,
      },
    },
  ];

  Object.entries(tokens.font.size).forEach(function (entry) {
    definitions.push({
      collectionName: COLLECTIONS.PRIMITIVES,
      name: "font/size/" + entry[0],
      resolvedType: "FLOAT",
      scopes: PRIMITIVE_SCOPE_CONFIG.size,
      value: {
        kind: "RAW",
        value: entry[1],
      },
    });
  });

  Object.entries(tokens.font.lineHeight).forEach(function (entry) {
    definitions.push({
      collectionName: COLLECTIONS.PRIMITIVES,
      name: "font/lineHeight/" + entry[0],
      resolvedType: "FLOAT",
      scopes: PRIMITIVE_SCOPE_CONFIG.lineHeight,
      value: {
        kind: "RAW",
        value: entry[1],
      },
    });
  });

  Object.entries(tokens.font.weight).forEach(function (entry) {
    definitions.push({
      collectionName: COLLECTIONS.PRIMITIVES,
      name: "font/weight/" + entry[0],
      resolvedType: "FLOAT",
      scopes: PRIMITIVE_SCOPE_CONFIG.weight,
      value: {
        kind: "RAW",
        value: entry[1],
      },
    });
  });

  return definitions;
}

function toTypographySemanticDefinitions(tokens) {
  const definitions = [];

  Object.entries(tokens.text).forEach(function (groupEntry) {
    const groupKey = groupEntry[0];
    const groupTokens = groupEntry[1];

    Object.entries(groupTokens).forEach(function (tokenEntry) {
      const tokenKey = tokenEntry[0];
      const tokenValues = tokenEntry[1];

      Object.entries(SEMANTIC_PROPERTY_CONFIG).forEach(function (propertyEntry) {
        const propertyKey = propertyEntry[0];
        const propertyConfig = propertyEntry[1];
        const target = tokenRefToVariableTarget(tokenValues[propertyKey]);

        definitions.push({
          collectionName: COLLECTIONS.SEMANTIC,
          name: "text/" + groupKey + "/" + tokenKey + "/" + propertyKey,
          resolvedType: propertyConfig.resolvedType,
          scopes: propertyConfig.scopes,
          value: {
            kind: "ALIAS",
            targetCollectionName: target.collectionName,
            targetName: target.variableName,
          },
        });
      });
    });
  });

  return definitions;
}

function toTypographyTextStyleDefinitions(tokens) {
  const definitions = [];
  const bodyWeightVariants = [
    {
      suffix: "/Default",
      weightVariableKey: collectionKey(COLLECTIONS.SEMANTIC, "text/body/%TOKEN%/weight"),
    },
    {
      suffix: "/Semibold",
      weightVariableKey: collectionKey(COLLECTIONS.PRIMITIVES, "font/weight/semibold"),
    },
    {
      suffix: "/Bold",
      weightVariableKey: collectionKey(COLLECTIONS.PRIMITIVES, "font/weight/bold"),
    },
  ];

  Object.entries(tokens.text).forEach(function (groupEntry) {
    const groupKey = groupEntry[0];
    const groupTokens = groupEntry[1];

    Object.entries(groupTokens).forEach(function (tokenEntry) {
      const tokenKey = tokenEntry[0];
      const tokenValues = tokenEntry[1];

      const baseDefinition = {
        fontFamilyVariableKey: collectionKey(COLLECTIONS.PRIMITIVES, "font/family/primary"),
        sizeVariableKey: collectionKey(COLLECTIONS.SEMANTIC, "text/" + groupKey + "/" + tokenKey + "/size"),
        lineHeightVariableKey: collectionKey(
          COLLECTIONS.SEMANTIC,
          "text/" + groupKey + "/" + tokenKey + "/lineHeight",
        ),
        fallbackFamily: tokens.font.family.primary,
        fallbackSize: resolveTokenRef(tokens, tokenValues.size),
        fallbackLineHeight: resolveTokenRef(tokens, tokenValues.lineHeight),
      };

      if (groupKey === "body") {
        bodyWeightVariants.forEach(function (variant) {
          definitions.push({
            name: getTextStyleName(groupKey, tokenKey, variant.suffix),
            fontFamilyVariableKey: baseDefinition.fontFamilyVariableKey,
            sizeVariableKey: baseDefinition.sizeVariableKey,
            lineHeightVariableKey: baseDefinition.lineHeightVariableKey,
            weightVariableKey: variant.weightVariableKey.replace("%TOKEN%", tokenKey),
            fallbackFamily: baseDefinition.fallbackFamily,
            fallbackSize: baseDefinition.fallbackSize,
            fallbackLineHeight: baseDefinition.fallbackLineHeight,
          });
        });
        return;
      }

      definitions.push({
        name: getTextStyleName(groupKey, tokenKey, ""),
        fontFamilyVariableKey: baseDefinition.fontFamilyVariableKey,
        sizeVariableKey: baseDefinition.sizeVariableKey,
        lineHeightVariableKey: baseDefinition.lineHeightVariableKey,
        weightVariableKey: collectionKey(COLLECTIONS.SEMANTIC, "text/" + groupKey + "/" + tokenKey + "/weight"),
        fallbackFamily: baseDefinition.fallbackFamily,
        fallbackSize: baseDefinition.fallbackSize,
        fallbackLineHeight: baseDefinition.fallbackLineHeight,
      });
    });
  });

  return definitions;
}

function toColorPrimitiveDefinitions(tokens) {
  const definitions = [];

  Object.entries(tokens.color.primitive).forEach(function (paletteEntry) {
    const paletteName = paletteEntry[0];
    const paletteValues = paletteEntry[1];

    Object.entries(paletteValues).forEach(function (stepEntry) {
      const stepKey = stepEntry[0];
      const value = stepEntry[1];

      definitions.push({
        collectionName: COLLECTIONS.PRIMITIVES,
        name: "color/" + paletteName + "/" + stepKey,
        resolvedType: "COLOR",
        scopes: COLOR_SCOPES,
        value: {
          kind: "RAW",
          value: hexToRgba(value),
        },
      });
    });
  });

  return definitions;
}

function collectColorSemanticDefinitions(node, pathParts, definitions) {
  Object.entries(node).forEach(function (entry) {
    const key = entry[0];
    const value = entry[1];

    if (isPlainObject(value)) {
      collectColorSemanticDefinitions(value, pathParts.concat([key]), definitions);
      return;
    }

    if (isHexColor(value)) {
      definitions.push({
        collectionName: COLLECTIONS.SEMANTIC,
        name: "color/" + pathParts.concat([key]).join("/"),
        resolvedType: "COLOR",
        scopes: COLOR_SCOPES,
        value: {
          kind: "RAW",
          value: hexToRgba(value),
        },
      });
      return;
    }

    const target = tokenRefToVariableTarget(value);
    definitions.push({
      collectionName: COLLECTIONS.SEMANTIC,
      name: "color/" + pathParts.concat([key]).join("/"),
      resolvedType: "COLOR",
      scopes: COLOR_SCOPES,
      value: {
        kind: "ALIAS",
        targetCollectionName: target.collectionName,
        targetName: target.variableName,
      },
    });
  });
}

function toColorSemanticDefinitions(tokens) {
  const definitions = [];
  collectColorSemanticDefinitions(tokens.color.semantic, [], definitions);
  return definitions;
}

async function getOrCreateCollections(collectionNames) {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const collectionMap = new Map();

  collections.forEach(function (collection) {
    collectionMap.set(collection.name, collection);
  });

  for (let index = 0; index < collectionNames.length; index += 1) {
    const collectionName = collectionNames[index];

    if (collectionMap.has(collectionName)) {
      continue;
    }

    const collection = figma.variables.createVariableCollection(collectionName);
    const defaultMode = collection.modes.find(function (mode) {
      return mode.name === DEFAULT_MODE_NAME;
    });

    if (defaultMode == null && collection.modes.length > 0) {
      collection.renameMode(collection.modes[0].modeId, DEFAULT_MODE_NAME);
    }

    collectionMap.set(collectionName, collection);
  }

  const resolvedCollections = {};

  collectionNames.forEach(function (collectionName) {
    const collection = collectionMap.get(collectionName);
    assert(collection, "Missing collection " + collectionName + ".");

    resolvedCollections[collectionName] = {
      collection: collection,
      modeId: collection.defaultModeId || (collection.modes[0] ? collection.modes[0].modeId : null),
    };

    assert(
      resolvedCollections[collectionName].modeId,
      "Collection " + collectionName + " must have one mode.",
    );
  });

  return resolvedCollections;
}

async function getExistingVariables(collectionsByName) {
  const variables = [];

  for (const collectionInfo of Object.values(collectionsByName)) {
    for (let index = 0; index < collectionInfo.collection.variableIds.length; index += 1) {
      const variableId = collectionInfo.collection.variableIds[index];
      const variable = await figma.variables.getVariableByIdAsync(variableId);

      if (variable) {
        variables.push(variable);
      }
    }
  }

  return variables;
}

function buildExistingVariableMap(existingVariables, collectionsByName) {
  const collectionNameById = new Map();

  Object.entries(collectionsByName).forEach(function (entry) {
    collectionNameById.set(entry[1].collection.id, entry[0]);
  });

  return new Map(
    existingVariables.map(function (variable) {
      return [
        collectionKey(collectionNameById.get(variable.variableCollectionId), variable.name),
        variable,
      ];
    }),
  );
}

function removeObsoleteVariables(existingVariables, desiredVariableKeys, collectionsByName, managedPrefixesByCollection) {
  const collectionNameById = new Map();
  let removedCount = 0;

  Object.entries(collectionsByName).forEach(function (entry) {
    collectionNameById.set(entry[1].collection.id, entry[0]);
  });

  existingVariables.forEach(function (variable) {
    const collectionName = collectionNameById.get(variable.variableCollectionId);
    const managedPrefixes = managedPrefixesByCollection[collectionName];

    if (!managedPrefixes) {
      return;
    }

    const isManaged = managedPrefixes.some(function (prefix) {
      return variable.name.indexOf(prefix) === 0;
    });

    if (!isManaged) {
      return;
    }

    const key = collectionKey(collectionName, variable.name);

    if (desiredVariableKeys.has(key)) {
      return;
    }

    if (typeof variable.remove === "function") {
      variable.remove();
      removedCount += 1;
    }
  });

  return removedCount;
}

async function getOrCreateTextStyles() {
  const styles = await figma.getLocalTextStylesAsync();
  return new Map(
    styles.map(function (style) {
      return [style.name, style];
    }),
  );
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

async function removeObsoleteTextStyles(desiredStyleNames) {
  const styles = await figma.getLocalTextStylesAsync();
  let removedCount = 0;

  styles.forEach(function (style) {
    if (style.name.indexOf(TEXT_STYLE_PREFIX + "/") !== 0) {
      return;
    }

    if (desiredStyleNames.has(style.name)) {
      return;
    }

    if (typeof style.remove === "function") {
      style.remove();
      removedCount += 1;
    }
  });

  return removedCount;
}

function getOrCreateVariable(definition, collectionsByName, existingVariableMap) {
  const key = collectionKey(definition.collectionName, definition.name);
  const existingVariable = existingVariableMap.get(key);

  if (existingVariable) {
    assert(
      existingVariable.resolvedType === definition.resolvedType,
      "Variable " +
        definition.name +
        " already exists in " +
        definition.collectionName +
        " with type " +
        existingVariable.resolvedType +
        ", expected " +
        definition.resolvedType +
        ".",
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

async function syncVariableDefinitions(definitions, managedPrefixesByCollection) {
  const collectionsByName = await getOrCreateCollections([COLLECTIONS.PRIMITIVES, COLLECTIONS.SEMANTIC]);
  const existingVariables = await getExistingVariables(collectionsByName);
  const existingVariableMap = buildExistingVariableMap(existingVariables, collectionsByName);
  const syncedVariables = new Map();
  const desiredVariableKeys = new Set();

  definitions.forEach(function (definition) {
    desiredVariableKeys.add(collectionKey(definition.collectionName, definition.name));
    const variable = getOrCreateVariable(definition, collectionsByName, existingVariableMap);
    syncedVariables.set(collectionKey(definition.collectionName, definition.name), variable);
  });

  definitions.forEach(function (definition) {
    const variable = syncedVariables.get(collectionKey(definition.collectionName, definition.name));
    const modeId = collectionsByName[definition.collectionName].modeId;

    if (definition.value.kind === "ALIAS") {
      const targetVariable = syncedVariables.get(
        collectionKey(definition.value.targetCollectionName, definition.value.targetName),
      );
      assert(targetVariable, "Missing alias target " + definition.value.targetName + ".");
      variable.setValueForMode(modeId, figma.variables.createVariableAlias(targetVariable));
      return;
    }

    variable.setValueForMode(modeId, definition.value.value);
  });

  const refreshedVariables = await getExistingVariables(collectionsByName);
  const removedVariableCount = removeObsoleteVariables(
    refreshedVariables,
    desiredVariableKeys,
    collectionsByName,
    managedPrefixesByCollection,
  );

  return {
    collectionsByName: collectionsByName,
    syncedVariables: syncedVariables,
    removedVariableCount: removedVariableCount,
  };
}

async function syncTextStyles(styleDefinitions, syncedVariables) {
  const existingStyleMap = await getOrCreateTextStyles();
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });

  styleDefinitions.forEach(function (styleDefinition) {
    const style = getOrCreateTextStyle(styleDefinition, existingStyleMap);
    const familyVariable = syncedVariables.get(styleDefinition.fontFamilyVariableKey);
    const sizeVariable = syncedVariables.get(styleDefinition.sizeVariableKey);
    const lineHeightVariable = syncedVariables.get(styleDefinition.lineHeightVariableKey);
    const weightVariable = syncedVariables.get(styleDefinition.weightVariableKey);

    assert(familyVariable, "Missing family variable for text style " + styleDefinition.name + ".");
    assert(sizeVariable, "Missing size variable for text style " + styleDefinition.name + ".");
    assert(
      lineHeightVariable,
      "Missing line-height variable for text style " + styleDefinition.name + ".",
    );
    assert(weightVariable, "Missing weight variable for text style " + styleDefinition.name + ".");

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
  });
}

async function syncTypography(tokens) {
  const primitiveDefinitions = toTypographyPrimitiveDefinitions(tokens);
  const semanticDefinitions = toTypographySemanticDefinitions(tokens);
  const textStyleDefinitions = toTypographyTextStyleDefinitions(tokens);
  const variableDefinitions = primitiveDefinitions.concat(semanticDefinitions);
  const syncResult = await syncVariableDefinitions(variableDefinitions, {
    Primitives: ["font/"],
    Semantic: ["text/"],
  });
  const desiredStyleNames = new Set(
    textStyleDefinitions.map(function (definition) {
      return definition.name;
    }),
  );

  await syncTextStyles(textStyleDefinitions, syncResult.syncedVariables);
  const removedTextStyleCount = await removeObsoleteTextStyles(desiredStyleNames);

  return {
    primitiveCount: primitiveDefinitions.length,
    semanticCount: semanticDefinitions.length,
    textStyleCount: textStyleDefinitions.length,
    presetCount: Object.keys(tokens.text.body).length + Object.keys(tokens.text.heading).length,
    removedVariableCount: syncResult.removedVariableCount,
    removedTextStyleCount: removedTextStyleCount,
  };
}

async function syncColors(tokens) {
  const primitiveDefinitions = toColorPrimitiveDefinitions(tokens);
  const semanticDefinitions = toColorSemanticDefinitions(tokens);
  const variableDefinitions = primitiveDefinitions.concat(semanticDefinitions);
  const syncResult = await syncVariableDefinitions(variableDefinitions, {
    Primitives: ["color/"],
    Semantic: ["color/"],
  });

  return {
    primitiveCount: primitiveDefinitions.length,
    semanticCount: semanticDefinitions.length,
    removedVariableCount: syncResult.removedVariableCount,
  };
}
