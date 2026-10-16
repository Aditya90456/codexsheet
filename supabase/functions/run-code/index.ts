import { createClient } from "npm:@supabase/supabase-js@2";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@5.9.6";

const clerkIssuer = (Deno.env.get("CLERK_JWT_ISSUER") || "https://optimum-panda-5.clerk.accounts.dev").replace(/\/$/, "");
const clerkJwks = createRemoteJWKSet(new URL(`${clerkIssuer}/.well-known/jwks.json`));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const languageIds = new Set([54, 62, 63, 71]);
const outputLimit = 8_000;

type TestCase = {
  case_number: number;
  stdin: string;
  expected_output: string;
};

type Judge0Result = {
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  message?: string | null;
  status?: { id?: number; description?: string };
};

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function hasAuthenticatedSubject(request: Request) {
  const authorization = request.headers.get("Authorization");
  const token = authorization?.match(/^Bearer\s+([^\s]+)$/i)?.[1];
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, clerkJwks, {
      issuer: clerkIssuer,
      algorithms: ["RS256"],
    });
    return payload.role === "authenticated" && typeof payload.sub === "string" && payload.sub.length > 0;
  } catch {
    return false;
  }
}

function normalizeOutput(output: string) {
  return output
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

function boundedText(value: unknown) {
  return typeof value === "string" ? value.slice(0, outputLimit) : "";
}

function mapStatus(result: Judge0Result, expectedOutput?: string) {
  const statusId = result.status?.id;
  if (statusId === 3 && expectedOutput !== undefined) {
    return normalizeOutput(result.stdout ?? "") === normalizeOutput(expectedOutput)
      ? "Passed"
      : "Wrong Answer";
  }
  if (statusId === 3) return "Executed";
  return result.status?.description || result.message || "Execution failed";
}

async function submitToJudge0(
  endpoint: URL,
  headers: HeadersInit,
  sourceCode: string,
  languageId: number,
  stdin: string,
): Promise<Judge0Result> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        source_code: sourceCode,
        language_id: languageId,
        stdin,
        cpu_time_limit: 2,
        cpu_extra_time: 1,
        wall_time_limit: 5,
        memory_limit: 128_000,
        max_processes_and_threads: 30,
        enable_network: false,
      }),
      signal: controller.signal,
    });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(`Judge0 rejected the run (${response.status}).`);
    }
    if (typeof payload !== "object" || payload === null || !("status" in payload)) {
      throw new Error("Judge0 returned an invalid execution result.");
    }
    const result = payload as Judge0Result;
    if (result.status?.id === 1 || result.status?.id === 2) {
      throw new Error("Judge0 is still processing this run. Please try again.");
    }
    return result;
  } finally {
    clearTimeout(timeoutId);
  }
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return respond({ error: "Use POST to run code." }, 405);
  }
  if (!await hasAuthenticatedSubject(request)) {
    return respond({ error: "Sign in with a valid account to run code." }, 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return respond({ error: "Request body must be valid JSON." }, 400);
  }
  if (typeof body !== "object" || body === null) {
    return respond({ error: "Request body must be a JSON object." }, 400);
  }
  const requestBody = body as {
    problemNumber?: unknown;
    languageId?: unknown;
    sourceCode?: unknown;
    customInput?: unknown;
  };
  const { problemNumber, languageId, sourceCode, customInput } = requestBody;
  if (
    !Number.isInteger(problemNumber) ||
    (problemNumber as number) < 1 ||
    (problemNumber as number) > 250
  ) {
    return respond({ error: "Choose a valid problem." }, 400);
  }
  if (!Number.isInteger(languageId) || !languageIds.has(languageId as number)) {
    return respond({ error: "Choose a supported programming language." }, 400);
  }
  if (
    typeof sourceCode !== "string" ||
    sourceCode.trim().length === 0 ||
    sourceCode.length > 30_000
  ) {
    return respond({ error: "Source code must be between 1 and 30,000 characters." }, 400);
  }
  if (typeof customInput !== "string" || customInput.length > 10_000) {
    return respond({ error: "Custom input must be text of at most 10,000 characters." }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const judge0ApiUrl = Deno.env.get("JUDGE0_API_URL");
  const judge0ApiKey = Deno.env.get("JUDGE0_API_KEY");
  const judge0ApiHost = Deno.env.get("JUDGE0_API_HOST");
  if (!supabaseUrl || !serviceRoleKey || !judge0ApiUrl) {
    return respond({ error: "The code runner is not configured on the server." }, 503);
  }

  let endpoint: URL;
  try {
    const baseUrl = new URL(judge0ApiUrl);
    if (baseUrl.protocol !== "https:") {
      return respond({ error: "JUDGE0_API_URL must use HTTPS." }, 503);
    }
    endpoint = new URL("submissions", baseUrl.href.endsWith("/") ? baseUrl : `${baseUrl.href}/`);
    endpoint.searchParams.set("base64_encoded", "false");
    endpoint.searchParams.set("wait", "true");
  } catch {
    return respond({ error: "JUDGE0_API_URL is not a valid HTTPS URL." }, 503);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: testCases, error: testCasesError } = await supabase
    .from("dsa_problem_test_cases")
    .select("case_number, stdin, expected_output")
    .eq("problem_number", problemNumber)
    .order("case_number", { ascending: true })
    .limit(10);
  if (testCasesError) {
    console.error("Could not load problem test cases:", testCasesError.message);
    return respond({ error: "Could not load test cases for this problem." }, 500);
  }
  if (!testCases?.length) {
    return respond({ error: "No test cases have been configured for this problem yet." }, 404);
  }

  const headers = new Headers({ "Content-Type": "application/json" });
  if (judge0ApiKey) headers.set("X-RapidAPI-Key", judge0ApiKey);
  if (judge0ApiHost) headers.set("X-RapidAPI-Host", judge0ApiHost);

  const results: Array<{
    label: string;
    status: string;
    stdout: string;
    stderr: string;
  }> = [];
  try {
    for (const testCase of testCases as TestCase[]) {
      const result = await submitToJudge0(
        endpoint,
        headers,
        sourceCode,
        languageId as number,
        testCase.stdin,
      );
      results.push({
        label: `Test case ${testCase.case_number}`,
        status: mapStatus(result, testCase.expected_output),
        stdout: boundedText(result.stdout),
        stderr: boundedText(result.compile_output || result.stderr),
      });
      if (result.status?.id === 6) break;
    }

    if (customInput.length > 0) {
      const result = await submitToJudge0(
        endpoint,
        headers,
        sourceCode,
        languageId as number,
        customInput,
      );
      results.push({
        label: "Custom input",
        status: mapStatus(result),
        stdout: boundedText(result.stdout),
        stderr: boundedText(result.compile_output || result.stderr),
      });
    }
  } catch (error) {
    console.error("Judge0 execution failed:", error);
    return respond({
      error: error instanceof Error
        ? error.message
        : "The code execution service could not complete the run.",
    }, 502);
  }

  const passed = results.filter((result) => result.status === "Passed").length;
  const tested = results.filter((result) => result.label.startsWith("Test case")).length;
  return respond({
    summary: `${passed} of ${tested} test cases passed.`,
    passed,
    total: tested,
    results,
  });
});

