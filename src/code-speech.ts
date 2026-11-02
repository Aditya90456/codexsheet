// code-speech.ts — reads a line of the pattern skeleton out loud in plain words.
// The films teach from code, so the voice has to say what the highlighted line
// says: "for (let i = 0; i < k; i++)" becomes "Loop i starts at 0, while i is
// less than k". This is a reader for the JavaScript shapes used by the sixteen
// templates in dsaPatterns.ts, not a general JS engine: it tokenises, walks
// expressions by precedence and speaks the structures the skeletons contain.
type Kind = "id" | "num" | "str" | "op";
type Tok = { k: Kind; v: string };

const MULTI = [
  ">>>", "...", "===", "!==", ">=", "<=", "==", "&&", "||", "=>", "++", "--",
  "+=", "-=", "*=", "/=", "%=", "^=", "|=", "&=", ">>", "<<", "->",
];
const SINGLE = "+-*/%=<>!&|^~?:;,.()[]{}";

function lex(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) { i += 1; continue; }
    const rest = src.slice(i);
    const ident = /^[A-Za-z_$][\w$]*/.exec(rest);
    if (ident) { out.push({ k: "id", v: ident[0] }); i += ident[0].length; continue; }
    const num = /^\d+(\.\d+)?/.exec(rest);
    if (num) { out.push({ k: "num", v: num[0] }); i += num[0].length; continue; }
    if (ch === "'" || ch === '"') {
      const end = rest.indexOf(ch, 1);
      out.push({ k: "str", v: end > 0 ? rest.slice(1, end) : ch });
      i += end > 0 ? end + 1 : 1;
      continue;
    }
    const multi = MULTI.find((op) => rest.startsWith(op));
    if (multi) { out.push({ k: "op", v: multi }); i += multi.length; continue; }
    if (SINGLE.includes(ch)) { out.push({ k: "op", v: ch }); i += 1; continue; }
    i += 1;
  }
  return out;
}

const ASSIGN: Record<string, string> = {
  "=": "is", "+=": "increases by", "-=": "decreases by", "*=": "is multiplied by",
  "/=": "is divided by", "%=": "becomes the remainder of", "^=": "is xored with",
  "|=": "is or-ed with", "&=": "is and-ed with",
};

const BINARY: Record<string, string> = {
  "||": "or", "&&": "and", "===": "is the same as", "==": "is the same as",
  "!==": "is not the same as", "!=": "is not the same as", ">=": "is at least",
  "<=": "is at most", ">": "is more than", "<": "is less than", "|": "or",
  "^": "xor", "&": "and", "+": "plus", "-": "minus", "*": "times",
  "/": "divided by", "%": "mod", ">>": "shifted right by", "<<": "shifted left by",
  "=>": "gives", "->": "maps to",
};

const LEVELS = [["||"], ["&&"], ["===", "!==", "==", "!=", ">=", "<=", ">", "<"], ["|"], ["^"], ["&"], ["+", "-"], ["*", "/", "%", ">>", "<<"]];

/** Words that mark a phrase as a yes/no test, so `return` can say "whether". */
const RETURN_TEST = [" is the same as", " is not the same as", " is at least", " is at most", " is more than", " is less than", " is one of"];

/** A phrase that already reads as a clause, so a condition needs no filler. */
const isClause = (text: string) => /\b(is|are|gives|contains|includes|fits?|holds|starts)\b/.test(text);

/** Plain-English names for the identifiers the sheet's skeletons use. */
const NAMES: Record<string, string> = {
  dp: "the table", lcs: "the longest common subsequence", nums: "the input values",
  intervals: "the intervals", stack: "the stack", queue: "the queue", seen: "what we have already seen",
  merged: "the merged list", heap: "the heap", curr: "the current node", prev: "the previous node",
  answer: "the answer", results: "the results", result: "the result", path: "the current path",
  choices: "the choices", choice: "this choice", temps: "the temperatures", value: "the value",
  values: "the values", char: "the character", mid: "the midpoint", sum: "the running total",
  best: "the best so far", count: "the count", target: "the target", capacity: "the capacity",
  left: "the left bound", right: "the right bound", start: "the start", end: "the end",
  finish: "its finish time", current: "the interval we are looking at", last: "the interval we kept last",
  root: "the node", key: "the key", node: "the node", j: "j",
  pairs: "the closer-to-opener table", s: "the string", a: "the first input", b: "the second input",
  k: "k", i: "i", n: "n", m: "m", Infinity: "infinity", head: "the head",
  next: "the next value", skip: "the best if we skip this house", take: "the best if we take this house",
  length: "length", isValid: "the path is still legal", isComplete: "the path is complete",
  remaining: "what is left to choose", neighbours: "the neighbour list",
};

const LITERALS: Record<string, string> = {
  null: "nothing", undefined: "nothing", true: "true", false: "false", NaN: "not a number",
};

/** Phrases for `obj.method(args)` - the receiver has to end up in the right place. */
const METHODS: Record<string, (recv: string, args: string) => string> = {
  push: (recv, args) => (args ? `push ${args} onto ${recv}` : `push onto ${recv}`),
  pop: (recv) => `the top item removed from ${recv}`,
  shift: (recv) => `the front item removed from ${recv}`,
  unshift: (recv, args) => `put ${args} at the front of ${recv}`,
  add: (recv, args) => `add ${args} to ${recv}`,
  has: (recv, args) => `${recv} contains ${args}`,
  delete: (recv, args) => `remove ${args} from ${recv}`,
  set: (recv, args) => `store ${andList(args)} in ${recv}`,
  get: (recv, args) => `${args} from ${recv}`,
  indexOf: (recv, args) => (args.includes(recv) ? `the index of ${args}` : `the index of ${args} in ${recv}`),
  includes: (recv, args) => `${recv} includes ${args}`,
  sort: (recv, args) => (args ? `sort ${recv} so that ${args}` : `sort ${recv}`),
  fill: (recv, args) => `${recv} filled with ${args}`,
  splice: (recv, args) => {
    const parts = argParts(args);
    return parts.length >= 2 ? `${recv} removes ${parts[1]} entry at ${parts[0]}` : `${recv} removes ${args}`;
  },
  map: (recv, args) => `a list the same length as ${recv} where ${args}`,
  filter: (recv, args) => `keep from ${recv} the items where ${args}`,
  join: (recv, args) => `join ${recv} with ${args}`,
  slice: (recv, args) => `the slice of ${recv} from ${args}`,
  at: (recv, args) => (/^minus 1$/.test(args.trim()) ? `the last item of ${recv}` : `the item at ${args} in ${recv}`),
  values: (recv) => `the values of ${recv}`,
  keys: (recv) => `the keys of ${recv}`,
  charCodeAt: (recv, args) => `the character code at ${args} of ${recv}`,
};

/** Standalone calls, including the `Math.*` forms. */
const CALLS: Record<string, (args: string) => string> = {
  max: (args) => (args.includes("everything in") ? `the largest of ${args}` : `the larger of ${args}`),
  min: (args) => (args.includes("everything in") ? `the smallest of ${args}` : `the smaller of ${args}`),
  floor: (args) => `${args} rounded down`,
  abs: (args) => `the size of ${args}`,
  Array: (args) => `an array of ${args}`,
  Map: () => "a hash map",
  Set: (args) => (args ? `a set holding ${args.replace(/^a list holding /, "")}` : "a set"),
};

/** `Math`, `Object` and friends: the member is the verb, the receiver is noise. */
const NAMESPACES: Record<string, true> = { Math: true, Object: true, Number: true, JSON: true };

/** Calls named by a bare identifier, keyed on the raw identifier. */
const FUNCTIONS: Record<string, (args: string) => string> = {
  canonicalForm: (args) => `the key that stands for every anagram of ${args}`,
  maxDepth: (args) => `the depth of ${args}`,
  isComplete: (args) => `${args} is a complete path`,
  isValid: (args) => `${args} still fit`,
  remaining: (args) => `what is left to choose after ${args}`,
  backtrack: (args) => `recurse on ${args}`,
  neighbours: (args) => `the neighbours of ${args}`,
};

const PROPS: Record<string, (recv: string) => string> = {
  length: (recv) => `the length of ${recv}`,
  next: (recv) => `the next pointer of ${recv}`,
  left: (recv) => `the left child of ${recv}`,
  right: (recv) => `the right child of ${recv}`,
  values: (recv) => `the values of ${recv}`,
  keys: (recv) => `the keys of ${recv}`,
  start: (recv) => `the start of ${recv}`,
  end: (recv) => `the end of ${recv}`,
};

const SYMBOLS: Record<string, string> = {
  "(": "open parenthesis", ")": "close parenthesis", "[": "open bracket", "]": "close bracket",
  "{": "open brace", "}": "close brace", "": "empty string",
};

const nameWord = (raw: string) => {
  if (NAMES[raw]) return NAMES[raw];
  const spaced = raw
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_$]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  return spaced || raw;
};

const argParts = (args: string) => args.split(", ").filter(Boolean);
const andList = (args: string) => argParts(args).join(" and ");
const unarticle = (phrase: string) => phrase.replace(/^(the|a|an|this) /, "");

/** `const [start, finish]` or `const value`, spoken as the loop's item names. */
function bindingWords(toks: Tok[]): string {
  const kept = toks.filter((t) => !(t.k === "id" && ["const", "let", "var"].includes(t.v)));
  const names = splitTop(kept, ",")
    .map((group) => group.filter((t) => t.k === "id").map((t) => unarticle(nameWord(t.v))).join(" and "))
    .filter(Boolean);
  return names.join(" and ") || "each item";
}

/**
 * Whole-line readings for the two idioms that no precedence walk can say
 * briefly: an ascending comparator and a zero-filled 2-D table.
 */
const LINE_RULES: Array<{ test: RegExp; say: (m: RegExpMatchArray, code: string) => string }> = [
  {
    test: /^(\w+)\.sort\(\((\w+),\s*(\w+)\)\s*=>\s*(\w+)\[(\d+)\]\s*-\s*(\w+)\[(\d+)\]\);$/,
    say: (m) => `Sort ${nameWord(m[1])} so that the item with the smaller value at position ${m[5]} comes first.`,
  },
  {
    test: /^const\s+(\w+)\s*=\s*Array\.from\(\s*\{\s*length:/,
    say: (m, code) => {
      const rows = /length:\s*([^}]+)\}/.exec(code)?.[1] ?? "";
      const cols = /Array\(([^)]*)\)/.exec(code)?.[1] ?? "";
      const fill = /fill\((\d+)\)/.exec(code)?.[1] ?? "0";
      return `Build ${nameWord(m[1])} as a grid of ${read(rows)} rows by ${read(cols)} columns, every cell starting at ${fill}.`;
    },
  },
];

const read = (code: string) => new Reader(lex(code.trim())).program();

class Reader {
  private at = 0;
  private pending = "";
  private lastIdent = "";
  constructor(private readonly toks: Tok[], private readonly forInit = false) {}

  private peek(step = 0): Tok | undefined { return this.toks[this.at + step]; }
  private isOp(v: string, step = 0) { const t = this.peek(step); return t?.k === "op" && t.v === v; }
  private take(v: string) { if (this.isOp(v)) this.at += 1; }
  private skipPunc() { while (this.isOp(";") || this.isOp(",")) this.at += 1; }

  /** The whole remaining run as a sentence, splitting statements on top-level `;`. */
  program(): string {
    const parts: string[] = [];
    while (this.at < this.toks.length) {
      const start = this.at;
      this.statement();
      if (this.at > start && this.pending) parts.push(this.pending);
      this.skipPunc();
    }
    return parts.join(", then ");
  }

  private statement(): void {
    const first = this.peek();
    if (!first) return;
    if (first.k === "op" && (first.v === "{" || first.v === "}" || first.v === ")")) { this.at += 1; this.pending = ""; return; }
    if (first.k === "op" && (first.v === "?" || first.v === ":")) {
      this.at += 1;
      const body = this.expr();
      this.pending = first.v === "?" ? `If they match, ${body}` : `Otherwise, ${body}`;
      return;
    }
    if (first.k === "op" && first.v === "...") { this.at += 1; this.pending = `everything in ${this.expr()}`; return; }
    if (first.k === "id") {
      if (first.v === "function") return this.functionDecl();
      if (first.v === "for") return this.forStmt();
      if (this.isOneOf("while", "if", "return", "continue", "break", "else")) return this.keywordStmt();
      if (this.isOneOf("const", "let", "var")) return this.declaration();
    }
    this.pending = this.expr();
  }

  private isOneOf(...words: string[]) {
    const t = this.peek();
    return Boolean(t && t.k === "id" && words.includes(t.v));
  }

  private functionDecl() {
    this.at += 1;
    const fn = this.peek();
    this.at += 1;
    const params = this.parenArgs();
    const name = fn?.k === "id" ? unarticle(nameWord(fn.v)) : "this function";
    this.pending = `the function ${name} takes ${andList(params) || "nothing"}`;
  }

  private forStmt() {
    this.at += 1;
    const head = this.parenTokens();
    const body = this.blockText();
    const ofIndex = head.findIndex((t) => t.k === "id" && t.v === "of");
    if (ofIndex > 0) {
      const items = new Reader(head.slice(ofIndex + 1)).expr();
      this.pending = `for each ${bindingWords(head.slice(0, ofIndex))} in ${items}`;
    } else {
      const bits: Tok[][] = [[]];
      for (const t of head) {
        if (t.k === "op" && t.v === ";") bits.push([]);
        else bits[bits.length - 1].push(t);
      }
      const init = new Reader(bits[0] ?? [], true).program();
      const cond = condSentence(new Reader(bits[1] ?? []).expr());
      const step = new Reader(bits[2] ?? []).expr();
      this.pending = `loop ${init}` + (cond ? `, while ${cond}` : "") + (step ? `, and each pass ${step}` : "");
    }
    this.pending += body ? `; the body: ${body}` : "";
  }

  private keywordStmt() {
    const word = (this.peek() as Tok).v;
    this.at += 1;
    if (word === "continue") { this.pending = "skip this one"; return; }
    if (word === "break") { this.pending = "stop the loop"; return; }
    if (word === "else") { this.pending = `otherwise, ${this.statementText()}`; return; }
    if (word === "return") {
      const body = this.expr();
      this.pending = body ? `return${RETURN_TEST.some((w) => body.includes(w)) ? " whether" : ""} ${body}` : "return";
      return;
    }
    if (word === "if" || word === "while") {
      const cond = new Reader(this.parenTokens()).program();
      const lead = word === "if" ? "if" : "while";
      let text = cond.trim().startsWith("not ")
        ? `unless ${condSentence(cond.trim().slice(4), "exists")}`
        : `${lead} ${condSentence(cond)}`;
      // statementText() overwrites pending, so the sentence is built in a local.
      const cons = this.statementText();
      if (cons) text += `, ${cons}`;
      const elsewhere = this.elseIndex();
      if (elsewhere !== -1) {
        this.at = elsewhere + 1;
        const alt = this.statementText();
        if (alt) text += `; otherwise, ${alt}`;
      }
      this.pending = text;
      return;
    }
    this.pending = nameWord(word);
  }

  private elseIndex(): number {
    let scan = this.at;
    while (scan < this.toks.length && this.toks[scan].k === "op" && [";", ")"].includes(this.toks[scan].v)) scan += 1;
    const t = this.toks[scan];
    return t && t.k === "id" && t.v === "else" ? scan : -1;
  }

  private declaration() {
    this.at += 1;
    const parts: string[] = [];
    for (;;) {
      const name = this.peek();
      this.at += 1;
      let value = "";
      if (this.isOp("=")) { this.at += 1; value = this.expr(); }
      const spoken = name?.k === "id" ? nameWord(name.v) : "a value";
      parts.push(value ? `${spoken} ${this.forInit ? "starts at" : "as"} ${value}` : spoken);
      if (this.isOp(",")) { this.at += 1; continue; }
      break;
    }
    this.pending = this.forInit ? parts.join(", then ") : `keep ${parts.join(", then ")}`;
  }

  private blockText(): string {
    const start = this.at;
    this.take("{");
    if (start === this.at && !this.isOp("}")) return "";
    const parts: string[] = [];
    while (this.at < this.toks.length && !this.isOp("}")) {
      const before = this.at;
      this.statement();
      if (this.at > before && this.pending) parts.push(this.pending);
      this.skipPunc();
    }
    this.take("}");
    return parts.join(", then ");
  }

  /** One statement or block, returned as text (used for if/else bodies). */
  private statementText(): string {
    if (this.isOp("{")) return this.blockText();
    const before = this.at;
    this.statement();
    const said = this.at > before ? this.pending : "";
    this.skipPunc();
    return said;
  }

  private parenTokens(): Tok[] {
    const out: Tok[] = [];
    this.take("(");
    let depth = 1;
    while (this.at < this.toks.length && depth > 0) {
      const t = this.peek() as Tok;
      this.at += 1;
      if (t.k === "op" && (t.v === "(" || t.v === "[" || t.v === "{")) depth += 1;
      if (t.k === "op" && (t.v === ")" || t.v === "]" || t.v === "}")) { depth -= 1; if (depth === 0) break; }
      out.push(t);
    }
    return out;
  }

  /** The tokens inside one pair of parentheses, arrows included. */
  private parenArgs(): string {
    const inner = this.parenTokens();
    const arrow = topLevelIndex(inner, "=>");
    if (arrow === -1) return splitTop(inner, ",").map((g) => new Reader(g).program()).filter(Boolean).join(", ");
    const params = splitTop(inner.slice(0, arrow), ",")
      .map((g) => new Reader(g).program())
      .filter(Boolean)
      .join(" and ");
    const body = new Reader(inner.slice(arrow + 1)).program();
    return `${params || "each item"} gives ${body}`;
  }

  // ---- expressions ------------------------------------------------------

  private expr(): string { return this.ternary(); }

  private ternary(): string {
    const cond = this.level(0);
    if (!this.isOp("?")) return cond;
    this.at += 1;
    const when = this.ternary();
    this.take(":");
    const other = this.ternary();
    return `if ${cond}, ${when}; otherwise ${other}`;
  }

  private level(index: number): string {
    if (index >= LEVELS.length) return this.unary();
    let left = this.level(index + 1);
    let tested = false;
    for (;;) {
      const t = this.peek();
      const op = t?.k === "op" ? t.v : "";
      const isKeywordTest = index === 2 && t?.k === "id" && t.v === "in";
      if (!isKeywordTest && !(op && LEVELS[index].includes(op))) return left;
      this.at += 1;
      const right = this.level(index + 1);
      // `a && b` only ever appears in a test, and a bare side needs a verb.
      if (index <= 1) {
        if (!tested) { left = condSentence(left); tested = true; }
        left = `${left} ${BINARY[op] ?? op} ${condSentence(right)}`;
      } else {
        left = `${left} ${isKeywordTest ? "is one of" : BINARY[op] ?? op} ${right}`;
      }
    }
  }

  private unary(): string {
    const t = this.peek();
    if (t?.k === "id" && t.v === "new") {
      this.at += 1;
      return `a new ${unarticle(this.postfix())}`;
    }
    if (t?.k === "op" && (t.v === "!" || t.v === "-" || t.v === "+" || t.v === "~")) {
      this.at += 1;
      const inner = this.unary();
      if (t.v === "!") return `not ${inner}`;
      if (t.v === "-") return `minus ${inner}`;
      if (t.v === "~") return `the bit flip of ${inner}`;
      return inner;
    }
    return this.postfix();
  }

  private postfix(): string {
    let node = this.primary();
    for (;;) {
      if (this.isOp(".")) {
        const recvIdent = this.lastIdent;
        this.at += 1;
        const member = this.peek();
        this.at += 1;
        const key = member?.k === "id" ? member.v : "";
        const namespaced = Boolean(NAMESPACES[recvIdent]);
        if (this.isOp("(")) {
          const args = this.parenArgs();
          if (namespaced) {
            const phrase = CALLS[key];
            node = phrase ? phrase(andList(args)) : `${nameWord(key)} of ${args}`;
          } else {
            const phrase = METHODS[key] ?? CALLS[key];
            node = phrase ? phrase(node, args) : `${nameWord(key)} of ${node}${args ? ` with ${args}` : ""}`;
          }
        } else {
          const prop = PROPS[key];
          node = namespaced ? `${nameWord(recvIdent)} ${nameWord(key)}` : (prop ? prop(node) : `${nameWord(key)} of ${node}`);
        }
        this.lastIdent = "";
        continue;
      }
      if (this.isOp("[")) {
        const indexes: string[] = [];
        while (this.isOp("[")) {
          this.at += 1;
          indexes.push(this.expr());
          this.take("]");
        }
        node = indexes.length === 1 ? `${node} at ${indexes[0]}` : `${node} at ${indexes.join(" and ")}`;
        this.lastIdent = "";
        continue;
      }
      if (this.isOp("(")) {
        const ident = this.lastIdent;
        const args = this.parenArgs();
        const phrase = (ident && (FUNCTIONS[ident] ?? CALLS[ident])) || undefined;
        node = phrase ? phrase(andList(args)) : `${node}${args ? ` of ${andList(args)}` : ""}`;
        this.lastIdent = "";
        continue;
      }
      if (this.isOp("++") || this.isOp("--")) {
        const up = (this.peek() as Tok).v === "++";
        this.at += 1;
        node = `${node} ${up ? "goes up by one" : "goes down by one"}`;
        continue;
      }
      const t = this.peek();
      if (t && t.k === "op" && ASSIGN[t.v]) {
        this.at += 1;
        const rhs = this.expr();
        // A name whose value is a yes/no test is decided, not equal.
        node = RETURN_TEST.some((w) => rhs.includes(w))
          ? `${node} is decided by whether ${rhs}`
          : `${node} ${ASSIGN[t.v]} ${rhs}`;
        continue;
      }
      return node;
    }
  }

  private primary(): string {
    const t = this.peek();
    this.lastIdent = "";
    if (!t) return "";
    if (t.k === "op" && t.v === "(") {
      const said = new Reader(this.parenTokens()).program();
      this.take(")");
      return said ? `(${said})` : "";
    }
    if (t.k === "op" && t.v === "[") {
      this.at += 1;
      if (this.isOp("]")) { this.at += 1; return "an empty list"; }
      const inner = readTo(this.toks, this.at, "]");
      this.at = indexOfClose(this.toks, this.at) + 1;
      const only = splitTop(inner, ",");
      if (only.length === 1 && only[0][0]?.k === "op" && only[0][0]?.v === "...") {
        return `a copy of ${new Reader(only[0].slice(1)).expr()}`;
      }
      const items = only.map((group) => new Reader(group).program()).filter(Boolean);
      return items.length ? `a list holding ${items.join(" and ")}` : "an empty list";
    }
    if (t.k === "op" && t.v === "{") {
      this.at += 1;
      const pairs = splitTop(readTo(this.toks, this.at, "}"), ",").map((group) => {
        const kv = splitTop(group, ":");
        if (kv.length === 2) return `${new Reader(kv[0]).program()} maps to ${new Reader(kv[1]).program()}`;
        return new Reader(group).program();
      }).filter(Boolean);
      this.at = indexOfClose(this.toks, this.at) + 1;
      return `an object where ${pairs.join(", ")}`;
    }
    if (t.k === "op" && t.v === "...") { this.at += 1; return `everything in ${this.primary()}`; }
    if (t.k === "num") { this.at += 1; return t.v; }
    if (t.k === "str") { this.at += 1; return SYMBOLS[t.v] ?? `"${t.v}"`; }
    if (t.k === "id") {
      this.at += 1;
      this.lastIdent = t.v;
      return LITERALS[t.v] ?? nameWord(t.v);
    }
    this.at += 1;
    return "";
  }
}

function splitTop(toks: Tok[], sep: string): Tok[][] {
  const out: Tok[][] = [[]];
  let depth = 0;
  for (const t of toks) {
    if (t.k === "op" && "([{}".includes(t.v)) depth += 1;
    if (t.k === "op" && ")]}".includes(t.v)) depth -= 1;
    if (t.k === "op" && t.v === sep && depth === 0) { out.push([]); continue; }
    out[out.length - 1].push(t);
  }
  return out.filter((group) => group.length > 0);
}

function topLevelIndex(toks: Tok[], value: string): number {
  let depth = 0;
  for (let i = 0; i < toks.length; i += 1) {
    const t = toks[i];
    if (t.k !== "op") continue;
    if ("([{}".includes(t.v)) depth += 1;
    if (")]}".includes(t.v)) depth -= 1;
    if (depth === 0 && t.v === value) return i;
  }
  return -1;
}

function readTo(toks: Tok[], from: number, close: string): Tok[] {
  let depth = 0;
  const out: Tok[] = [];
  for (let i = from; i < toks.length; i += 1) {
    const t = toks[i];
    if (t.k === "op" && "([{}".includes(t.v)) depth += 1;
    if (t.k === "op" && t.v === close && depth === 0) break;
    if (t.k === "op" && ")]}".includes(t.v)) depth -= 1;
    out.push(t);
  }
  return out;
}

/** The closer that matches an opener we already stepped past. */
function indexOfClose(toks: Tok[], from: number): number {
  let depth = 0;
  for (let i = from; i < toks.length; i += 1) {
    const t = toks[i];
    if (t.k !== "op") continue;
    if ("([{}".includes(t.v)) depth += 1;
    else if (")]}".includes(t.v)) {
      if (depth === 0) return i;
      depth -= 1;
    }
  }
  return toks.length - 1;
}

/** Loop conditions and bound tests, said the way a person would say them. */
function condSentence(cond: string, bare = "is not nothing"): string {
  const trimmed = cond.trim();
  if (!trimmed) return "";
  const lengthTest = /^the length of (.+)$/.exec(trimmed);
  if (lengthTest && !isClause(trimmed)) return `the length of ${lengthTest[1]} is above zero`;
  if (isClause(trimmed)) return trimmed;
  return `${trimmed} ${bare}`;
}

const commentSpoken = (raw: string) =>
  raw
    .replace(/->/g, " maps to ")
    .replace(/\s+/g, " ")
    .trim();

const tidy = (text: string) =>
  text
    .replace(/\s+/g, " ")
    .replace(/\s*([,.;])\s*/g, "$1 ")
    .replace(/\(\s*/, "(")
    .replace(/\s*\)/g, ")")
    .replace(/is the same as 0/g, "is zero")
    .replace(/^(.)/, (m) => m.toUpperCase())
    .replace(/[.?!]$/, ".")
    .trim();

const IMPERATIVE: Array<[RegExp, string]> = [
  [/^the top item removed from (.+?)$/, "pop the top off $1"],
  [/^the front item removed from (.+?)$/, "take the front off $1"],
];

/** One template line, spoken. Empty when the line carries nothing to say. */
export function speakCode(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) return "";
  const cut = trimmed.indexOf("//");
  const code = cut === -1 ? trimmed : trimmed.slice(0, cut);
  const comment = cut === -1 ? "" : commentSpoken(trimmed.slice(cut + 2));
  let said = speakTokens(code.trim());
  for (const [test, template] of IMPERATIVE) said = said.replace(test, template);
  const body = said && comment ? `${said}. Note: ${comment}.` : said || comment;
  return body ? tidy(body.endsWith(".") ? body : `${body}.`) : "";
}

function speakTokens(code: string): string {
  if (!code) return "";
  for (const rule of LINE_RULES) {
    const match = rule.test.exec(code);
    if (match) return rule.say(match, code);
  }
  const toks = lex(code);
  return toks.length ? new Reader(toks).program() : "";
}
