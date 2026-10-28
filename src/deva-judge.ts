// Turns the LeetCode-style fixtures in deva-test-cases.ts into a stdin/stdout
// contract, so Python, Java and C++ submissions can be judged instead of merely run.
// One argument per line; a list argument is its elements separated by single spaces.
import { devaTestCases } from "./deva-test-cases";

export type JudgeCase = { stdin: string; expected: string };
export type ArgKind = "ints" | "doubles" | "strings" | "int" | "double" | "string" | "bool";
export type Language = "JavaScript" | "Python" | "Java" | "C++";

export function splitTestArguments(source: string): string[] {
  const parts: string[] = [];
  let start = 0;
  let depth = 0;
  let quote = "";
  let escaped = false;
  for (let index = 0; index < source.length; index++) {
    const character = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = "";
    } else if (character === "\"" || character === "'") quote = character;
    else if (character === "[" || character === "{" || character === "(") depth++;
    else if (character === "]" || character === "}" || character === ")") depth--;
    else if (character === "," && depth === 0) {
      parts.push(source.slice(start, index).trim());
      start = index + 1;
    }
  }
  parts.push(source.slice(start).trim());
  return parts.filter(Boolean);
}

export function parseTestLiteral(source: string): unknown {
  // Test fixtures are authored with JS/JSON-compatible literals.
  return Function(`"use strict"; return (${source});`)();
}

function parseArguments(input: string): unknown[] | null {
  try {
    const values = splitTestArguments(input).map((assignment) => {
      const separator = assignment.indexOf("=");
      return separator < 0 ? assignment : assignment.slice(separator + 1);
    });
    const args = parseTestLiteral(`[${values.join(",")}]`);
    return Array.isArray(args) ? args : null;
  } catch { return null; }
}

function scalarToken(value: unknown): string | null {
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  // A string with spaces or nothing in it cannot survive a whitespace-split line.
  if (typeof value === "string") return value && !/\s/.test(value) ? value : null;
  return null;
}

export function renderLine(value: unknown): string | null {
  if (Array.isArray(value)) {
    const tokens = value.map(scalarToken);
    if (tokens.some((token) => token === null)) return null;
    return tokens.join(" ");
  }
  if (typeof value === "string") return /\n/.test(value) ? null : value;
  return scalarToken(value);
}

function kindOf(value: unknown): ArgKind | null {
  if (typeof value === "number") return Number.isInteger(value) ? "int" : "double";
  if (typeof value === "boolean") return "bool";
  if (typeof value === "string") return "string";
  if (!Array.isArray(value) || value.length === 0) return null;
  if (value.every((item) => typeof item === "number")) return value.every(Number.isInteger) ? "ints" : "doubles";
  if (value.every((item) => typeof item === "string" && item && !/\s/.test(item))) return "strings";
  return null;
}

function argumentNames(input: string): string[] {
  return splitTestArguments(input).map((assignment) => assignment.split("=")[0].trim() || "arg");
}

/**
 * Arguments LeetCode models as a linked list or a tree. A line of integers is
 * not enough to rebuild them, so those problems stay on Run instead of being
 * judged against a misleading starter.
 */
const structuralArgs = /^(head|tail|list1|list2|l1|l2|root|node|tree|cursor|prev|next)$/;

function conforms(arg: unknown, kind: ArgKind): boolean {
  // An empty list carries no element type, so it matches any list kind.
  if (Array.isArray(arg) && arg.length === 0) return kind === "ints" || kind === "doubles" || kind === "strings";
  return kindOf(arg) === kind;
}

/**
 * Judgeable cases for a problem, or null when the fixtures use shapes the
 * line-based contract cannot express (nested lists, empty or spaced strings).
 */
export function judgeCases(problemNumber: number): JudgeCase[] | null {
  const items = devaTestCases[problemNumber]?.examples ?? [];
  const first = items[0];
  if (!first) return null;
  if (argumentNames(first.input).some((name) => structuralArgs.test(name))) return null;
  const firstArgs = parseArguments(first.input);
  if (!firstArgs) return null;
  const kinds: ArgKind[] = [];
  for (const argument of firstArgs) {
    const kind = kindOf(argument);
    if (!kind) return null;
    kinds.push(kind);
  }
  const cases: JudgeCase[] = [];
  for (const item of items) {
    const args = parseArguments(item.input);
    if (!args || args.length !== kinds.length) return null;
    if (args.some((arg, index) => !conforms(arg, kinds[index]))) return null;
    let expected: string | null;
    try { expected = renderLine(parseTestLiteral(item.output)); } catch { expected = null; }
    const lines = args.map(renderLine);
    if (expected === null || lines.some((line) => line === null)) return null;
    cases.push({ stdin: `${(lines as string[]).join("\n")}\n`, expected });
  }
  return cases.slice(0, 5);
}

export function argNames(problemNumber: number): string[] {
  const items = devaTestCases[problemNumber]?.examples ?? [];
  return items.length ? argumentNames(items[0].input) : [];
}

export function argKinds(problemNumber: number): ArgKind[] | null {
  const items = devaTestCases[problemNumber]?.examples ?? [];
  const args = items.length ? parseArguments(items[0].input) : null;
  if (!args) return null;
  const kinds: ArgKind[] = [];
  for (const argument of args) {
    const kind = kindOf(argument);
    if (!kind) return null;
    kinds.push(kind);
  }
  return kinds;
}

function tokens(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

/** Order-sensitive, whitespace-tolerant, and numeric-aware so `1` matches `1.0`. */
export function outputsMatch(actual: string, expected: string): boolean {
  const got = tokens(actual);
  const want = tokens(expected);
  if (got.length !== want.length) return false;
  return got.every((token, index) => {
    if (token === want[index]) return true;
    const left = Number(token);
    const right = Number(want[index]);
    return Number.isFinite(left) && Number.isFinite(right) && left === right;
  });
}

const pythonRead: Record<ArgKind, string> = {
  ints: "[int(x) for x in {line}.split()]",
  doubles: "[float(x) for x in {line}.split()]",
  strings: "[x for x in {line}.split()]",
  int: "int({line})",
  double: "float({line})",
  string: "{line}",
  bool: "{line} == \"true\"",
};

const javaRead: Record<ArgKind, string> = {
  ints: "ints({line})",
  doubles: "doubles({line})",
  strings: "strs({line})",
  int: "Integer.parseInt({line})",
  double: "Double.parseDouble({line})",
  string: "{line}",
  bool: "\"true\".equals({line})",
};

const cppRead: Record<ArgKind, string> = {
  ints: `readInts({line})`,
  doubles: `readDoubles({line})`,
  strings: `readStrs({line})`,
  int: "stoi({line})",
  double: "stod({line})",
  string: "{line}",
  bool: "{line} == \"true\"",
};

function readLine(template: string, accessor: string): string {
  return template.replace(/\{line\}/g, accessor);
}

function pythonDriver(names: string[], kinds: ArgKind[]): string {
  const reads = names.map((name, index) => `${name} = ${readLine(pythonRead[kinds[index]], `lines[${index}]`)}`);
  return `import sys

lines = sys.stdin.read().splitlines()
${reads.join("\n") || "lines = []"}


def show(value):
    if isinstance(value, (list, tuple)):
        return " ".join("true" if item is True else "false" if item is False else str(item) for item in value)
    if isinstance(value, bool):
        return "true" if value else "false"
    return str(value)


# Write your solution below, then Submit to run the judged cases.
def solution(${names.join(", ") || "data"}):
    return []


print(show(solution(${names.join(", ") || "data"})))`;
}

function javaDriver(names: string[], kinds: ArgKind[]): string {
  const reads = names.map((name, index) => {
    const kind = kinds[index];
    const declared = kind === "ints" ? "int[] " : kind === "doubles" ? "double[] " : kind === "strings" ? "String[] " : kind === "int" ? "int " : kind === "double" ? "double " : kind === "bool" ? "boolean " : "String ";
    return `    ${declared}${name} = ${readLine(javaRead[kind], `lines[${index}]`)};`;
  });
  return `import java.io.*;
import java.util.*;

class Main {
  static String show(Object value) {
    if (value instanceof int[] array) return Arrays.toString(array).replaceAll("[\\\\[\\\\],]", " ").trim().replaceAll("\\\\s+", " ");
    if (value instanceof double[] array) return Arrays.toString(array).replaceAll("[\\\\[\\\\],]", " ").trim().replaceAll("\\\\s+", " ");
    if (value instanceof Object[] array) return show(Arrays.asList(array));
    if (value instanceof List<?> list) {
      StringJoiner joiner = new StringJoiner(" ");
      for (Object item : list) joiner.add(item instanceof Boolean flag ? String.valueOf(flag).toLowerCase() : String.valueOf(item));
      return joiner.toString();
    }
    if (value instanceof Boolean flag) return flag ? "true" : "false";
    return String.valueOf(value);
  }

  static int[] ints(String line) {
    if (line.isEmpty()) return new int[0];
    String[] parts = line.split(" ");
    int[] values = new int[parts.length];
    for (int index = 0; index < parts.length; index++) values[index] = Integer.parseInt(parts[index]);
    return values;
  }

  static double[] doubles(String line) {
    if (line.isEmpty()) return new double[0];
    String[] parts = line.split(" ");
    double[] values = new double[parts.length];
    for (int index = 0; index < parts.length; index++) values[index] = Double.parseDouble(parts[index]);
    return values;
  }

  static String[] strs(String line) {
    return line.isEmpty() ? new String[0] : line.split(" ");
  }

  // Write your solution below, then Submit to run the judged cases.
  static Object solution(${names.map((name, index) => `${kinds[index] === "ints" ? "int[]" : kinds[index] === "doubles" ? "double[]" : kinds[index] === "strings" ? "String[]" : kinds[index] === "int" ? "int" : kinds[index] === "double" ? "double" : kinds[index] === "bool" ? "boolean" : "String"} ${name}`).join(", ") || "String data"}) {
    return new int[0];
  }

  public static void main(String[] args) throws IOException {
    BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
    String[] lines = reader.lines().toArray(String[]::new);
${reads.join("\n")}
    System.out.println(show(solution(${names.join(", ")})));
  }
}`;
}

function cppDriver(names: string[], kinds: ArgKind[]): string {
  const typed = (kind: ArgKind) => kind === "ints" ? "vector<int>" : kind === "doubles" ? "vector<double>" : kind === "strings" ? "vector<string>" : kind === "int" ? "int" : kind === "double" ? "double" : kind === "bool" ? "bool" : "string";
  const reads = names.map((name, index) => `  ${typed(kinds[index])} ${name} = ${readLine(cppRead[kinds[index]], `lines[${index}]`)};`);
  return `#include <algorithm>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
using namespace std;

template <typename T> string show(const vector<T>& values) {
  string out;
  for (size_t index = 0; index < values.size(); index++) {
    if (index) out += " ";
    ostringstream text;
    text << values[index];
    out += text.str();
  }
  return out;
}

string show(bool value) { return value ? "true" : "false"; }
template <typename T> string show(T value) { ostringstream text; text << value; return text.str(); }

vector<int> readInts(const string& line) {
  vector<int> values;
  istringstream stream(line);
  for (int value; stream >> value;) values.push_back(value);
  return values;
}

vector<double> readDoubles(const string& line) {
  vector<double> values;
  istringstream stream(line);
  for (double value; stream >> value;) values.push_back(value);
  return values;
}

vector<string> readStrs(const string& line) {
  vector<string> values;
  istringstream stream(line);
  for (string value; stream >> value;) values.push_back(value);
  return values;
}

// Write your solution below, then Submit to run the judged cases.
vector<int> solution(${names.map((name, index) => `${typed(kinds[index])} ${name}`).join(", ") || "vector<int> data"}) {
  return {};
}

int main() {
  string line;
  vector<string> lines;
  while (getline(cin, line)) lines.push_back(line);
${reads.join("\n")}
  cout << show(solution(${names.join(", ")})) << endl;
  return 0;
}`;
}

/**
 * Starter source that already reads the judged stdin format and prints the
 * expected shape, so a first Submit is meaningful rather than a compile error.
 */
export function judgedStarter(language: Language, problemNumber: number): string | null {
  const kinds = argKinds(problemNumber);
  const names = argNames(problemNumber);
  if (!kinds || !names.length || kinds.length !== names.length) return null;
  const cases = judgeCases(problemNumber);
  if (!cases?.length) return null;
  const mark = language === "Python" ? "#" : "//";
  const inputFormat = names.map((name, index) => `${mark}   line ${index + 1}: ${name} (${kinds[index] === "ints" ? "integers, space separated" : kinds[index] === "doubles" ? "numbers, space separated" : kinds[index] === "strings" ? "words, space separated" : kinds[index] === "string" ? "a single word" : kinds[index] === "bool" ? "true or false" : kinds[index]})`).join("\n");
  const header = `${mark} Judged input: one argument per line.\n${inputFormat}\n${mark} Judged output: values separated by single spaces, booleans as true/false.\n`;
  if (language === "Python") return `${header}\n${pythonDriver(names, kinds)}\n`;
  if (language === "Java") return `${header}\n${javaDriver(names, kinds)}`;
  if (language === "C++") return `${header}\n${cppDriver(names, kinds)}`;
  return null;
}
