const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Language = "javascript" | "python" | "java" | "c++";
type TestCase = { case_number: number; stdin: string; expected_output: string };
type PistonStage = { stdout?: string; stderr?: string; code?: number | null; signal?: string | null; status?: string | null; message?: string | null };
type PistonResult = { compile?: PistonStage; run?: PistonStage; message?: string };

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function authenticatedUserId(request: Request) {
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  try {
    const payload = token.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/");
    if (!payload) return null;
    const claims = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, "="))) as { sub?: string; role?: string };
    return claims.role === "authenticated" && claims.sub ? claims.sub : null;
  } catch {
    return null;
  }
}

function normalizeOutput(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

function getRunStatus(result: PistonResult, expected: string) {
  if (result.compile && (result.compile.code !== 0 || result.compile.status)) {
    return { status: "Compile Error", actual: [result.compile.stderr, result.compile.message].filter(Boolean).join("\n") };
  }
  const run = result.run;
  if (!run) return { status: "Execution Error", actual: result.message || "The runner returned no execution result." };
  const actual = run.stdout ?? "";
  if (run.status === "TO") return { status: "Time Limit Exceeded", actual: run.stderr || run.message || "Execution timed out." };
  if (run.status || run.code !== 0 || run.signal) return { status: "Runtime Error", actual: [run.stderr, run.message].filter(Boolean).join("\n") || `Process exited with code ${run.code ?? "unknown"}.` };
  return { status: normalizeOutput(actual) === normalizeOutput(expected) ? "Passed" : "Failed", actual };
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return respond({ error: "Use POST to run code." }, 405);
  if (!authenticatedUserId(request)) return respond({ error: "Sign in to run code." }, 401);

  let payload: unknown;
  try { payload = await request.json(); } catch { return respond({ error: "Request body must be valid JSON." }, 400); }
  if (!payload || typeof payload !== "object") return respond({ error: "Request body must be an object." }, 400);
  const input = payload as { problemNumber?: unknown; language?: unknown; sourceCode?: unknown; customInput?: unknown };
  const problemNumber = Number(input.problemNumber);
  const language = input.language as Language;
  if (!Number.isInteger(problemNumber) || problemNumber < 1 || problemNumber > 250) return respond({ error: "Choose a valid problem." }, 400);
  if (!["javascript", "python", "java", "c++"].includes(language)) return respond({ error: "Choose a supported programming language: C++, Python, Java, or JavaScript." }, 400);
  if (typeof input.sourceCode !== "string" || !input.sourceCode.trim() || input.sourceCode.length > 30000) return respond({ error: "Code must contain between 1 and 30 KB." }, 400);
  if (input.customInput !== undefined && (typeof input.customInput !== "string" || input.customInput.length > 10000)) return respond({ error: "Input is limited to 10 KB." }, 400);

  const apiUrl = Deno.env.get("CODE_EXECUTION_API_URL")?.trim().replace(/\/+$/, "");
  const apiKey = Deno.env.get("CODE_EXECUTION_API_KEY")?.trim();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (!apiUrl) return respond({ error: "The code execution API is not configured on the server. Set CODE_EXECUTION_API_URL." }, 503);
  if (!supabaseUrl || !serviceRoleKey) return respond({ error: "Private test-case storage is not configured on the server." }, 503);
  if (!apiUrl.startsWith("https://") && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(`${apiUrl}/`)) return respond({ error: "The code execution API URL must use HTTPS." }, 503);

  const apiHeaders: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) apiHeaders.Authorization = `Bearer ${apiKey}`;

  try {
    const caseUrl = new URL("/rest/v1/dsa_problem_test_cases", supabaseUrl);
    caseUrl.searchParams.set("select", "case_number,stdin,expected_output");
    caseUrl.searchParams.set("problem_number", `eq.${problemNumber}`);
    caseUrl.searchParams.set("order", "case_number.asc");
    const caseResponse = await fetch(caseUrl, { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } });
    if (!caseResponse.ok) throw new Error(`Could not load private test cases (${caseResponse.status}).`);
    const cases = await caseResponse.json() as TestCase[];
    if (!Array.isArray(cases) || cases.length === 0) throw new Error("No test cases are configured for this problem.");

    const runtimeResponse = await fetch(`${apiUrl}/runtimes`, { headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {}, signal: AbortSignal.timeout(10000) });
    if (!runtimeResponse.ok) throw new Error(`The code execution API could not list runtimes (${runtimeResponse.status}).`);
    const runtimes = await runtimeResponse.json() as Array<{ language: string; version: string; aliases?: string[] }>;
    const runtime = runtimes.find((item) => item.language.toLowerCase() === language || item.aliases?.some((alias) => alias.toLowerCase() === language));
    if (!runtime) throw new Error(`The configured code execution API does not have a ${language} runtime installed.`);

    const allCases = [...cases.map((testCase) => ({ label: `Test ${testCase.case_number}`, stdin: testCase.stdin, expected: testCase.expected_output })),
      ...(typeof input.customInput === "string" && input.customInput.length > 0 ? [{ label: "Custom input", stdin: input.customInput, expected: null }] : [])];
    const results = await Promise.all(allCases.map(async (testCase) => {
      const response = await fetch(`${apiUrl}/execute`, {
        method: "POST",
        headers: apiHeaders,
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify({
          language: runtime.language,
          version: runtime.version,
          files: [{ name: language === "python" ? "main.py" : language === "java" ? "Main.java" : language === "c++" ? "main.cpp" : "main.js", content: input.sourceCode }],
          stdin: testCase.stdin,
          compile_timeout: 10000,
          run_timeout: 3000,
          compile_memory_limit: 256000000,
          run_memory_limit: 256000000,
        }),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`The code execution API rejected a run (${response.status}). ${detail.slice(0, 500)}`);
      }
      const result = await response.json() as PistonResult;
      const outcome = getRunStatus(result, testCase.expected ?? "");
      const status = testCase.expected === null && (outcome.status === "Passed" || outcome.status === "Failed") ? "Executed" : outcome.status;
      return { label: testCase.label, status, stdout: result.run?.stdout ?? "", stderr: status === "Passed" || status === "Executed" ? "" : outcome.actual };
    }));
    const passed = results.filter((item) => item.status === "Passed").length;
    const total = cases.length;
    return respond({ summary: `${passed}/${total} test cases passed${allCases.length > total ? ` · ${results[results.length - 1].label} executed` : ""}`, passed, total, results });
  } catch (error) {
    const message = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")
      ? "The code execution API timed out. Try again."
      : error instanceof Error && error.message === "Failed to fetch"
        ? "Could not reach the code execution API. Check its URL and availability."
        : error instanceof Error ? error.message : "The code execution API failed.";
    return respond({ error: message }, 502);
  }
});
