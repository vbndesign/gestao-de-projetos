import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKENS_DIR = path.resolve(__dirname, "../tokens");
const OUTPUT_FILE = path.resolve(__dirname, "../../../src/app/design-system-tokens.css");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function camelToKebab(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * Flatten a nested object into a map of dotted paths → leaf values.
 * e.g. { color: { primitive: { brand: { 500: "#8955F1" } } } }
 *   → { "color.primitive.brand.500": "#8955F1" }
 */
function flattenObject(obj, prefix = "") {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, p));
    } else {
      result[p] = value;
    }
  }
  return result;
}

/**
 * Resolve a token reference like "{color.primitive.brand.500}" recursively.
 * Detects circular and missing references.
 */
function resolveRef(value, flatMap, chain = []) {
  if (typeof value !== "string") return value;

  const match = /^\{(.+)\}$/.exec(value);
  if (!match) return value;

  const refPath = match[1];

  if (chain.includes(refPath)) {
    throw new Error(`Circular reference: ${[...chain, refPath].join(" → ")}`);
  }
  if (!(refPath in flatMap)) {
    throw new Error(`Missing reference: "${refPath}" (from ${chain.at(-1) ?? "root"})`);
  }

  return resolveRef(flatMap[refPath], flatMap, [...chain, refPath]);
}

/**
 * Convert a dotted token path to a CSS custom property name.
 *
 * color.*  → --ds-color-*
 * font.*   → --ds-typography-*  (strip "font" prefix)
 * text.*   → --ds-typography-text-*
 */
function pathToCssVar(p) {
  if (p.startsWith("color.")) {
    return "--ds-" + p.split(".").map(camelToKebab).join("-");
  }
  if (p.startsWith("font.")) {
    const rest = p.slice("font.".length);
    return "--ds-typography-" + rest.split(".").map(camelToKebab).join("-");
  }
  if (p.startsWith("text.")) {
    return "--ds-typography-" + p.split(".").map(camelToKebab).join("-");
  }
  return "--ds-" + p.split(".").map(camelToKebab).join("-");
}

/**
 * Format a resolved value for CSS output.
 * - hex strings → as-is
 * - font weights → unitless number
 * - font sizes / line heights → px
 * - font family → quoted string
 * - other strings → as-is
 */
function formatValue(tokenPath, value) {
  if (typeof value === "string") {
    // Font family names get quotes for CSS (only font.family.*, not color.semantic.family.*)
    if (tokenPath.startsWith("font.family.")) return `"${value}"`;
    return value;
  }
  if (typeof value === "number") {
    // Weights are unitless
    if (tokenPath.includes("weight")) return String(value);
    // Sizes and line heights are px
    if (tokenPath.includes("size") || tokenPath.includes("lineHeight")) {
      return `${value}px`;
    }
    return String(value);
  }
  return String(value);
}

// ---------------------------------------------------------------------------
// Section headers for readable output
// ---------------------------------------------------------------------------

const SECTION_LABELS = {
  "color.primitive": "Color Primitives",
  "color.semantic": "Color Semantic",
  "color.component": "Color Components",
  "font.family": "Typography — Family",
  "font.size": "Typography — Size",
  "font.lineHeight": "Typography — Line Height",
  "font.weight": "Typography — Weight",
  "text.body": "Typography — Text Body",
  "text.heading": "Typography — Text Heading",
};

function sectionKey(tokenPath) {
  const parts = tokenPath.split(".");
  return parts.slice(0, 2).join(".");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

try {
  console.log("Reading token files…");

  const colorsJson = JSON.parse(
    readFileSync(path.resolve(TOKENS_DIR, "colors.json"), "utf-8"),
  );
  const typographyJson = JSON.parse(
    readFileSync(path.resolve(TOKENS_DIR, "typography.json"), "utf-8"),
  );

  // Build unified flat map
  const flatMap = {
    ...flattenObject(colorsJson),
    ...flattenObject(typographyJson),
  };

  const totalRaw = Object.keys(flatMap).length;
  console.log(`Found ${totalRaw} raw tokens`);

  // Resolve all references
  const resolved = {};
  for (const [tokenPath, value] of Object.entries(flatMap)) {
    resolved[tokenPath] = resolveRef(value, flatMap, [tokenPath]);
  }

  // Collect paths by domain
  const colorPaths = Object.keys(resolved)
    .filter((p) => p.startsWith("color."))
    .sort();
  const fontPaths = Object.keys(resolved)
    .filter((p) => p.startsWith("font."))
    .sort();
  const textPaths = Object.keys(resolved)
    .filter((p) => p.startsWith("text."))
    .sort();

  const allPaths = [...colorPaths, ...fontPaths, ...textPaths];

  // Generate CSS
  const lines = [
    "/* Design System Tokens — generated by generate-css-tokens.mjs */",
    "/* DO NOT EDIT — run: node specs/design-system/scripts/generate-css-tokens.mjs */",
    "",
    ":root {",
  ];

  let currentSection = "";

  for (const tokenPath of allPaths) {
    const sec = sectionKey(tokenPath);
    if (sec !== currentSection) {
      if (currentSection) lines.push("");
      const label = SECTION_LABELS[sec] ?? sec;
      lines.push(`  /* ${label} */`);
      currentSection = sec;
    }

    const cssVar = pathToCssVar(tokenPath);
    const value = formatValue(tokenPath, resolved[tokenPath]);
    lines.push(`  ${cssVar}: ${value};`);
  }

  lines.push("}");
  lines.push("");

  const css = lines.join("\n");
  writeFileSync(OUTPUT_FILE, css, "utf-8");

  console.log(`Generated ${allPaths.length} CSS variables → ${OUTPUT_FILE}`);
} catch (error) {
  console.error("ERROR:", error.message);
  process.exitCode = 1;
}
