/**
 * lib/capabilities/agent/crew-output-schema.ts — Minimal JSON Schema
 * validator for `task.output_schema` (Phase 4 partial).
 *
 * Intentionally narrow: covers the cases real crews actually use, fails
 * gracefully on unknown constructs. Full Ajv integration is Phase 4
 * remainder.
 *
 * # Supported subset
 *
 * - `type`: "string" | "number" | "integer" | "boolean" | "object" | "array" | "null"
 * - `type` as an array: matches if value matches any
 * - For objects: `required` (list of keys that must be present),
 *   `properties` (each value's `type` is checked, recursively for nested objects)
 * - For arrays: `items.type` is checked for each element
 * - For numbers: `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`
 * - For strings: `minLength`, `maxLength`, `enum`
 *
 * # NOT supported (silently passes)
 *
 * - `anyOf` / `oneOf` / `allOf`
 * - `pattern` (regex)
 * - `format`
 * - `additionalProperties: false` strict mode
 * - `dependencies`, `if`/`then`/`else`
 * - Refs (`$ref`)
 *
 * If your schema needs any of the above, wait for Phase 4 full Ajv.
 *
 * # Parsing
 *
 * Output text from `respond()` is a string. If the schema expects an
 * object/array/number/etc, we try `JSON.parse()` first. Parse failure
 * is a validation failure with a clear error message.
 */

export type ValidationResult =
  | { ok: true; value: unknown }
  | { ok: false; error: string };

/**
 * Validate an output text against a JSON Schema fragment.
 *
 * Returns `ok: true, value` on success (value is the parsed JSON if
 * the schema expected non-string, else the original text).
 *
 * Returns `ok: false, error` on validation failure.
 */
export function validateOutputAgainstSchema(
  text: string,
  schema: Record<string, unknown>,
): ValidationResult {
  const schemaType = schema.type;
  const types = Array.isArray(schemaType) ? schemaType : schemaType ? [schemaType] : [];

  // No type declared — pass through.
  if (types.length === 0) return { ok: true, value: text };

  // If only "string" is expected, no JSON parse needed.
  if (types.length === 1 && types[0] === "string") {
    return validateString(text, schema);
  }

  // Otherwise we need to parse the text as JSON.
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `output is not valid JSON: ${msg}` };
  }

  // Check parsed value against each candidate type until one passes.
  const errors: string[] = [];
  for (const t of types) {
    const r = validateAs(parsed, String(t), schema);
    if (r.ok) return { ok: true, value: parsed };
    errors.push(`as ${t}: ${r.error}`);
  }
  return { ok: false, error: `output does not match any expected type — ${errors.join(" | ")}` };
}

// ── Per-type validators ──────────────────────────────────────────────

function validateAs(value: unknown, type: string, schema: Record<string, unknown>): ValidationResult {
  switch (type) {
    case "string":
      if (typeof value !== "string") return { ok: false, error: `expected string, got ${typeOf(value)}` };
      return validateString(value, schema);
    case "number":
      if (typeof value !== "number" || Number.isNaN(value)) {
        return { ok: false, error: `expected number, got ${typeOf(value)}` };
      }
      return validateNumber(value, schema);
    case "integer":
      if (typeof value !== "number" || !Number.isInteger(value)) {
        return { ok: false, error: `expected integer, got ${typeOf(value)}` };
      }
      return validateNumber(value, schema);
    case "boolean":
      if (typeof value !== "boolean") return { ok: false, error: `expected boolean, got ${typeOf(value)}` };
      return { ok: true, value };
    case "null":
      if (value !== null) return { ok: false, error: `expected null, got ${typeOf(value)}` };
      return { ok: true, value };
    case "object":
      if (value === null || typeof value !== "object" || Array.isArray(value)) {
        return { ok: false, error: `expected object, got ${typeOf(value)}` };
      }
      return validateObject(value as Record<string, unknown>, schema);
    case "array":
      if (!Array.isArray(value)) return { ok: false, error: `expected array, got ${typeOf(value)}` };
      return validateArray(value, schema);
    default:
      // Unknown type — pass through (we don't know how to check it).
      return { ok: true, value };
  }
}

function validateString(value: string, schema: Record<string, unknown>): ValidationResult {
  if (typeof schema.minLength === "number" && value.length < schema.minLength) {
    return { ok: false, error: `string length ${value.length} < minLength ${schema.minLength}` };
  }
  if (typeof schema.maxLength === "number" && value.length > schema.maxLength) {
    return { ok: false, error: `string length ${value.length} > maxLength ${schema.maxLength}` };
  }
  if (Array.isArray(schema.enum) && !schema.enum.includes(value)) {
    return { ok: false, error: `string "${value}" not in enum ${JSON.stringify(schema.enum)}` };
  }
  return { ok: true, value };
}

function validateNumber(value: number, schema: Record<string, unknown>): ValidationResult {
  if (typeof schema.minimum === "number" && value < schema.minimum) {
    return { ok: false, error: `value ${value} < minimum ${schema.minimum}` };
  }
  if (typeof schema.maximum === "number" && value > schema.maximum) {
    return { ok: false, error: `value ${value} > maximum ${schema.maximum}` };
  }
  if (typeof schema.exclusiveMinimum === "number" && value <= schema.exclusiveMinimum) {
    return { ok: false, error: `value ${value} <= exclusiveMinimum ${schema.exclusiveMinimum}` };
  }
  if (typeof schema.exclusiveMaximum === "number" && value >= schema.exclusiveMaximum) {
    return { ok: false, error: `value ${value} >= exclusiveMaximum ${schema.exclusiveMaximum}` };
  }
  return { ok: true, value };
}

function validateObject(value: Record<string, unknown>, schema: Record<string, unknown>): ValidationResult {
  // Required keys must be present.
  if (Array.isArray(schema.required)) {
    for (const k of schema.required) {
      if (typeof k !== "string") continue;
      if (!(k in value)) {
        return { ok: false, error: `missing required key "${k}"` };
      }
    }
  }
  // Type-check properties that are both in the value AND have a declared schema.
  const props = schema.properties;
  if (props !== null && typeof props === "object" && !Array.isArray(props)) {
    for (const [k, v] of Object.entries(value)) {
      const propSchema = (props as Record<string, unknown>)[k];
      if (propSchema === undefined) continue;
      if (typeof propSchema !== "object" || propSchema === null) continue;
      const r = validateOutputAgainstSchema(
        typeof v === "string" ? v : JSON.stringify(v),
        propSchema as Record<string, unknown>,
      );
      // Special case: if v is already non-string, validate directly against the property schema.
      if (typeof v !== "string") {
        const psType = (propSchema as Record<string, unknown>).type;
        const psTypes = Array.isArray(psType) ? psType : psType ? [psType] : [];
        if (psTypes.length === 0) continue;
        let okAny = false;
        const errs: string[] = [];
        for (const t of psTypes) {
          const rr = validateAs(v, String(t), propSchema as Record<string, unknown>);
          if (rr.ok) { okAny = true; break; }
          errs.push(`as ${t}: ${rr.error}`);
        }
        if (!okAny) {
          return { ok: false, error: `property "${k}" — ${errs.join(" | ")}` };
        }
        continue;
      }
      if (!r.ok) {
        return { ok: false, error: `property "${k}" — ${r.error}` };
      }
    }
  }
  return { ok: true, value };
}

function validateArray(value: unknown[], schema: Record<string, unknown>): ValidationResult {
  const items = schema.items;
  if (items !== null && typeof items === "object" && !Array.isArray(items)) {
    const itemSchema = items as Record<string, unknown>;
    const itType = itemSchema.type;
    const itTypes = Array.isArray(itType) ? itType : itType ? [itType] : [];
    if (itTypes.length > 0) {
      for (let i = 0; i < value.length; i++) {
        const v = value[i];
        let okAny = false;
        const errs: string[] = [];
        for (const t of itTypes) {
          const r = validateAs(v, String(t), itemSchema);
          if (r.ok) { okAny = true; break; }
          errs.push(`as ${t}: ${r.error}`);
        }
        if (!okAny) {
          return { ok: false, error: `array item [${i}] — ${errs.join(" | ")}` };
        }
      }
    }
  }
  if (typeof schema.minItems === "number" && value.length < schema.minItems) {
    return { ok: false, error: `array length ${value.length} < minItems ${schema.minItems}` };
  }
  if (typeof schema.maxItems === "number" && value.length > schema.maxItems) {
    return { ok: false, error: `array length ${value.length} > maxItems ${schema.maxItems}` };
  }
  return { ok: true, value };
}

function typeOf(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v;
}
