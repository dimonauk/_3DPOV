/**
 * lib/capabilities/agent/crew-predicate.ts — Safe expression evaluator
 * for crew schema `edge.when` predicates (Phase 3 of agent.crew-run).
 *
 * # Why this file
 *
 * The crew schema allows conditional graph edges via `edge.when` — a
 * string predicate evaluated against the crew's accumulated context.
 * We can't `eval()` it (untrusted code path, even from our own JSON);
 * we don't want a dependency just for this. So: a tiny safe recursive-
 * descent parser that supports a deliberately constrained grammar.
 *
 * # Supported grammar
 *
 *   expr      := or
 *   or        := and ( "||" and )*
 *   and       := not ( "&&" not )*
 *   not       := "!" not | comparison
 *   comparison := primary ( ( "==" | "!=" | "<" | "<=" | ">" | ">=" ) primary )?
 *   primary   := literal | identifier | "(" expr ")"
 *   literal   := number | string | "true" | "false" | "null"
 *   identifier := name ( "." name )* ( ".length" )?
 *   name      := /[a-zA-Z_][a-zA-Z0-9_]/
 *
 * # Examples (all from convergence-crew handoffs, paraphrased for edges)
 *
 *   `tir_pass == false`
 *   `status == "red"`
 *   `failing_segments.length > 0`
 *   `veto_list.length > 0 && tir_pass == true`
 *   `!ready`
 *
 * # What's deliberately NOT supported
 *
 * - Arithmetic (`+`, `-`, `*`, `/`)
 * - Function calls
 * - Array indexing
 * - String methods beyond `.length`
 * - Regex
 * - Object literals
 * - Ternary
 *
 * If the predicate needs any of that, it shouldn't be in a JSON crew
 * config — write a Phase-3+ runtime transform instead.
 */

// ── Tokenizer ────────────────────────────────────────────────────────

type TokenKind =
  | "number"
  | "string"
  | "bool"
  | "null"
  | "ident"
  | "lparen"
  | "rparen"
  | "and"
  | "or"
  | "not"
  | "eq"
  | "neq"
  | "lt"
  | "lte"
  | "gt"
  | "gte"
  | "eof";

type Token = {
  kind: TokenKind;
  value?: string | number | boolean | null;
  pos: number;
};

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = src.length;

  while (i < n) {
    const c = src[i]!;

    // Whitespace
    if (c === " " || c === "\t" || c === "\n" || c === "\r") {
      i++;
      continue;
    }

    // Parens
    if (c === "(") { tokens.push({ kind: "lparen", pos: i }); i++; continue; }
    if (c === ")") { tokens.push({ kind: "rparen", pos: i }); i++; continue; }

    // Two-char operators
    if (c === "&" && src[i + 1] === "&") { tokens.push({ kind: "and", pos: i }); i += 2; continue; }
    if (c === "|" && src[i + 1] === "|") { tokens.push({ kind: "or", pos: i }); i += 2; continue; }
    if (c === "=" && src[i + 1] === "=") { tokens.push({ kind: "eq", pos: i }); i += 2; continue; }
    if (c === "!" && src[i + 1] === "=") { tokens.push({ kind: "neq", pos: i }); i += 2; continue; }
    if (c === "<" && src[i + 1] === "=") { tokens.push({ kind: "lte", pos: i }); i += 2; continue; }
    if (c === ">" && src[i + 1] === "=") { tokens.push({ kind: "gte", pos: i }); i += 2; continue; }

    // Single-char operators
    if (c === "!") { tokens.push({ kind: "not", pos: i }); i++; continue; }
    if (c === "<") { tokens.push({ kind: "lt", pos: i }); i++; continue; }
    if (c === ">") { tokens.push({ kind: "gt", pos: i }); i++; continue; }

    // String literals — single or double quoted
    if (c === '"' || c === "'") {
      const quote = c;
      const start = i;
      i++;
      let buf = "";
      while (i < n && src[i] !== quote) {
        if (src[i] === "\\" && i + 1 < n) {
          // Minimal escape: \\ \" \' \n \t
          const next = src[i + 1]!;
          if (next === "\\") buf += "\\";
          else if (next === '"') buf += '"';
          else if (next === "'") buf += "'";
          else if (next === "n") buf += "\n";
          else if (next === "t") buf += "\t";
          else buf += next;
          i += 2;
        } else {
          buf += src[i];
          i++;
        }
      }
      if (i >= n) throw new PredicateParseError(`unterminated string at pos ${start}`);
      i++; // consume closing quote
      tokens.push({ kind: "string", value: buf, pos: start });
      continue;
    }

    // Numbers (no exponents, no leading sign — handled by `!`/identity)
    if ((c >= "0" && c <= "9") || (c === "." && src[i + 1] && src[i + 1]! >= "0" && src[i + 1]! <= "9")) {
      const start = i;
      let buf = "";
      let sawDot = false;
      while (i < n) {
        const ch = src[i]!;
        if (ch >= "0" && ch <= "9") { buf += ch; i++; continue; }
        if (ch === "." && !sawDot) { sawDot = true; buf += ch; i++; continue; }
        break;
      }
      const num = Number(buf);
      if (Number.isNaN(num)) throw new PredicateParseError(`invalid number at pos ${start}: ${buf}`);
      tokens.push({ kind: "number", value: num, pos: start });
      continue;
    }

    // Identifiers, including dotted access. Also keyword: true / false / null
    if ((c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_") {
      const start = i;
      let buf = "";
      while (i < n) {
        const ch = src[i]!;
        const isAlpha = (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z");
        const isDigit = ch >= "0" && ch <= "9";
        const isDotOrUnderscore = ch === "_" || ch === ".";
        if (isAlpha || isDigit || isDotOrUnderscore) { buf += ch; i++; }
        else break;
      }
      if (buf === "true") tokens.push({ kind: "bool", value: true, pos: start });
      else if (buf === "false") tokens.push({ kind: "bool", value: false, pos: start });
      else if (buf === "null") tokens.push({ kind: "null", value: null, pos: start });
      else tokens.push({ kind: "ident", value: buf, pos: start });
      continue;
    }

    throw new PredicateParseError(`unexpected character '${c}' at pos ${i}`);
  }

  tokens.push({ kind: "eof", pos: n });
  return tokens;
}

// ── AST nodes ────────────────────────────────────────────────────────

type Node =
  | { type: "literal"; value: unknown }
  | { type: "ident"; path: string[]; lengthAccess: boolean }
  | { type: "binop"; op: "==" | "!=" | "<" | "<=" | ">" | ">=" | "&&" | "||"; left: Node; right: Node }
  | { type: "not"; expr: Node };

// ── Parser ───────────────────────────────────────────────────────────

export class PredicateParseError extends Error {
  constructor(msg: string) {
    super(`predicate parse error: ${msg}`);
    this.name = "PredicateParseError";
  }
}

class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  private peek(): Token {
    return this.tokens[this.pos]!;
  }
  private consume(): Token {
    return this.tokens[this.pos++]!;
  }
  private expect(kind: TokenKind): Token {
    const t = this.peek();
    if (t.kind !== kind) throw new PredicateParseError(`expected ${kind} but got ${t.kind} at pos ${t.pos}`);
    return this.consume();
  }

  parseExpr(): Node {
    const node = this.parseOr();
    if (this.peek().kind !== "eof") {
      throw new PredicateParseError(`unexpected trailing token ${this.peek().kind} at pos ${this.peek().pos}`);
    }
    return node;
  }

  private parseOr(): Node {
    let left = this.parseAnd();
    while (this.peek().kind === "or") {
      this.consume();
      const right = this.parseAnd();
      left = { type: "binop", op: "||", left, right };
    }
    return left;
  }

  private parseAnd(): Node {
    let left = this.parseNot();
    while (this.peek().kind === "and") {
      this.consume();
      const right = this.parseNot();
      left = { type: "binop", op: "&&", left, right };
    }
    return left;
  }

  private parseNot(): Node {
    if (this.peek().kind === "not") {
      this.consume();
      return { type: "not", expr: this.parseNot() };
    }
    return this.parseComparison();
  }

  private parseComparison(): Node {
    const left = this.parsePrimary();
    const k = this.peek().kind;
    if (k === "eq" || k === "neq" || k === "lt" || k === "lte" || k === "gt" || k === "gte") {
      this.consume();
      const right = this.parsePrimary();
      const opMap: Record<string, "==" | "!=" | "<" | "<=" | ">" | ">="> = {
        eq: "==", neq: "!=", lt: "<", lte: "<=", gt: ">", gte: ">=",
      };
      return { type: "binop", op: opMap[k]!, left, right };
    }
    return left;
  }

  private parsePrimary(): Node {
    const t = this.peek();
    if (t.kind === "number" || t.kind === "string" || t.kind === "bool" || t.kind === "null") {
      this.consume();
      return { type: "literal", value: t.value === undefined ? null : t.value };
    }
    if (t.kind === "ident") {
      this.consume();
      const raw = t.value as string;
      const parts = raw.split(".");
      // `foo.bar.length` → identifier with lengthAccess
      let lengthAccess = false;
      if (parts.length > 1 && parts[parts.length - 1] === "length") {
        lengthAccess = true;
        parts.pop();
      }
      return { type: "ident", path: parts, lengthAccess };
    }
    if (t.kind === "lparen") {
      this.consume();
      const inner = this.parseOr();
      this.expect("rparen");
      return inner;
    }
    throw new PredicateParseError(`unexpected token ${t.kind} at pos ${t.pos}`);
  }
}

// ── Evaluator ────────────────────────────────────────────────────────

export class PredicateEvalError extends Error {
  constructor(msg: string) {
    super(`predicate eval error: ${msg}`);
    this.name = "PredicateEvalError";
  }
}

function resolveIdent(path: string[], lengthAccess: boolean, ctx: Record<string, unknown>): unknown {
  let cursor: unknown = ctx;
  for (const part of path) {
    if (cursor === null || cursor === undefined) return undefined;
    if (typeof cursor !== "object") return undefined;
    cursor = (cursor as Record<string, unknown>)[part];
  }
  if (lengthAccess) {
    if (cursor === null || cursor === undefined) return 0;
    if (Array.isArray(cursor) || typeof cursor === "string") return cursor.length;
    return 0;
  }
  return cursor;
}

function evalNode(node: Node, ctx: Record<string, unknown>): unknown {
  switch (node.type) {
    case "literal":
      return node.value;
    case "ident":
      return resolveIdent(node.path, node.lengthAccess, ctx);
    case "not": {
      const v = evalNode(node.expr, ctx);
      return !truthy(v);
    }
    case "binop": {
      // Short-circuit for && and ||
      if (node.op === "&&") {
        const l = evalNode(node.left, ctx);
        if (!truthy(l)) return false;
        return truthy(evalNode(node.right, ctx));
      }
      if (node.op === "||") {
        const l = evalNode(node.left, ctx);
        if (truthy(l)) return true;
        return truthy(evalNode(node.right, ctx));
      }
      // Comparison
      const l = evalNode(node.left, ctx);
      const r = evalNode(node.right, ctx);
      switch (node.op) {
        case "==": return looseEq(l, r);
        case "!=": return !looseEq(l, r);
        case "<": return compare(l, r) < 0;
        case "<=": return compare(l, r) <= 0;
        case ">": return compare(l, r) > 0;
        case ">=": return compare(l, r) >= 0;
      }
    }
  }
}

/** Truthy semantics — same as JS but explicit. */
function truthy(v: unknown): boolean {
  if (v === false || v === null || v === undefined) return false;
  if (typeof v === "number") return v !== 0 && !Number.isNaN(v);
  if (typeof v === "string") return v.length > 0;
  return true;
}

/** Loose equality — undefined and null are equal; numbers/strings coerce. */
function looseEq(l: unknown, r: unknown): boolean {
  if (l === r) return true;
  if (l === null && r === undefined) return true;
  if (l === undefined && r === null) return true;
  if (typeof l === "number" && typeof r === "string") return l === Number(r);
  if (typeof l === "string" && typeof r === "number") return Number(l) === r;
  return false;
}

/** Comparison for ordering operators — only for numbers or matching string/number coercion. */
function compare(l: unknown, r: unknown): number {
  if (typeof l === "number" && typeof r === "number") return l - r;
  if (typeof l === "string" && typeof r === "string") return l < r ? -1 : l > r ? 1 : 0;
  // Coerce strings to numbers if the other side is a number
  if (typeof l === "number" && typeof r === "string") {
    const rn = Number(r);
    if (!Number.isNaN(rn)) return l - rn;
  }
  if (typeof l === "string" && typeof r === "number") {
    const ln = Number(l);
    if (!Number.isNaN(ln)) return ln - r;
  }
  throw new PredicateEvalError(`cannot compare ${typeof l} and ${typeof r}`);
}

// ── Public surface ───────────────────────────────────────────────────

/**
 * Evaluate a predicate expression against a context object. Returns
 * the truthy/falsy result. Throws on parse or eval error.
 *
 * Common use: `edge.when` strings in graph-mode crew definitions,
 * evaluated against the accumulated `context_out` after each task.
 *
 * Empty string is treated as "always true" (unconditional edge).
 */
export function evaluatePredicate(expr: string, context: Record<string, unknown>): boolean {
  const trimmed = expr.trim();
  if (trimmed.length === 0) return true; // Empty = unconditional
  const tokens = tokenize(trimmed);
  const ast = new Parser(tokens).parseExpr();
  return truthy(evalNode(ast, context));
}

/**
 * Validate a predicate expression without evaluating. Returns null on
 * success or an error message. Useful for crew-definition linting at
 * design time.
 */
export function validatePredicate(expr: string): string | null {
  const trimmed = expr.trim();
  if (trimmed.length === 0) return null; // Empty = unconditional, always valid
  try {
    const tokens = tokenize(trimmed);
    new Parser(tokens).parseExpr();
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}
