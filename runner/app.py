"""Local Flask API that executes the DSA test editor's JavaScript solutions."""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import time
from collections import defaultdict, deque

from flask import Flask, jsonify, request

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 64 * 1024

ALLOWED_ORIGINS = {
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://codexsheet.in",
}
ALLOWED_ORIGINS.update(
    origin.strip().rstrip("/")
    for origin in os.environ.get("RUNNER_ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
)
FUNCTION_NAME = re.compile(r"^[A-Za-z_$][A-Za-z0-9_$]{0,80}$")
NODE_RUNNER = r'''
let body = "";
for await (const chunk of process.stdin) body += chunk;
const data = JSON.parse(body);
const stable = (value, unordered) => {
  if (Array.isArray(value)) {
    const items = value.map(item => stable(item, unordered));
    return unordered ? items.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))) : items;
  }
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key], unordered)]));
  return value;
};
try {
  const fn = new Function(data.code + "\n; return typeof " + data.fn + " === 'function' ? " + data.fn + " : null;")();
  if (!fn) throw new Error("Define the requested function: " + data.fn + ".");
  const details = data.cases.map((test, index) => {
    const actual = fn(...JSON.parse(JSON.stringify(test.args)));
    const pass = JSON.stringify(stable(actual, data.unordered)) === JSON.stringify(stable(test.expected, data.unordered));
    return { pass, label: "Test " + (index + 1), actual: JSON.stringify(actual), expected: JSON.stringify(test.expected) };
  });
  process.stdout.write(JSON.stringify({ passed: details.filter(test => test.pass).length, total: details.length, details: details.map(test => test.pass ? test.label + ": passed" : test.label + ": expected " + test.expected + ", received " + test.actual) }));
} catch (error) {
  process.stdout.write(JSON.stringify({ passed: 0, total: data.cases.length, details: [], error: error instanceof Error ? error.message : "Could not run this solution." }));
}
'''

request_times: dict[str, deque[float]] = defaultdict(deque)


def validate_request(data: object) -> tuple[dict | None, str | None]:
    if not isinstance(data, dict):
        return None, "Send a JSON object with code, function name, and test cases."
    code = data.get("code")
    fn = data.get("fn")
    cases = data.get("cases")
    if not isinstance(code, str) or len(code) > 20_000:
        return None, "Solution code must be a string under 20,000 characters."
    if not isinstance(fn, str) or not FUNCTION_NAME.fullmatch(fn):
        return None, "The requested function name is invalid."
    if not isinstance(cases, list) or not 1 <= len(cases) <= 12:
        return None, "Send between 1 and 12 test cases."
    for case in cases:
        if not isinstance(case, dict) or not isinstance(case.get("args"), list) or "expected" not in case:
            return None, "Each test case needs an args array and expected value."
    return {"code": code, "fn": fn, "cases": cases, "unordered": bool(data.get("unordered"))}, None


@app.post("/api/execute")
def execute():
    origin = request.headers.get("Origin")
    if origin and origin not in ALLOWED_ORIGINS:
        return jsonify({"error": "This local code runner only accepts requests from the development app."}), 403

    now = time.monotonic()
    client = request.remote_addr or "local"
    recent = request_times[client]
    while recent and now - recent[0] > 60:
        recent.popleft()
    if len(recent) >= 30:
        return jsonify({"error": "Too many runs. Wait a minute and try again."}), 429
    recent.append(now)

    payload, error = validate_request(request.get_json(silent=True))
    if error:
        return jsonify({"error": error}), 400

    node = os.environ.get("NODE_BINARY") or shutil.which("node")
    if not node:
        return jsonify({"error": "Node.js was not found. Install Node.js 20 or newer and restart the runner."}), 503

    try:
        # Keep the child process isolated from application secrets while retaining
        # the Windows runtime variables Node needs to initialize crypto correctly.
        node_env = {"PATH": os.environ.get("PATH", ""), "NODE_OPTIONS": ""}
        for name in ("SYSTEMROOT", "WINDIR", "TEMP", "TMP", "PATHEXT"):
            value = os.environ.get(name)
            if value:
                node_env[name] = value
        result = subprocess.run(
            [node, "--permission", "--input-type=module", "--max-old-space-size=64", "-e", NODE_RUNNER],
            input=json.dumps(payload, separators=(",", ":")),
            capture_output=True,
            text=True,
            timeout=8,
            check=False,
            env=node_env,
        )
    except subprocess.TimeoutExpired:
        return jsonify({"passed": 0, "total": len(payload["cases"]), "details": [], "error": "Execution timed out. Check for an infinite loop."})
    except OSError:
        return jsonify({"error": "Could not start Node.js. Check the local installation."}), 503

    if result.returncode != 0:
        message = (result.stderr or "JavaScript execution failed.").strip()[-1200:]
        return jsonify({"passed": 0, "total": len(payload["cases"]), "details": [], "error": message})
    try:
        output = json.loads(result.stdout)
    except json.JSONDecodeError:
        return jsonify({"error": "The JavaScript runner returned an invalid response."}), 500
    return jsonify(output)


@app.get("/health")
def health():
    return jsonify({"status": "ok", "runner": "javascript"})


if __name__ == "__main__":
    from waitress import serve

    serve(app, host="127.0.0.1", port=5000, threads=4)
