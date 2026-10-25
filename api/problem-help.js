import { createRemoteJWKSet, jwtVerify } from "jose";

let clerkJwks;

function getClerkConfig() {
  const publishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) throw new Error("Clerk is not configured on the server.");
  const encodedDomain = publishableKey.replace(/^pk_(test|live)_/, "");
  const domain = Buffer.from(encodedDomain, "base64").toString("utf8").replace(/\$$/, "");
  if (!/^[a-z0-9.-]+$/i.test(domain)) throw new Error("Clerk's publishable key is invalid.");
  return { issuer: `https://${domain}`, jwksUrl: `https://${domain}/.well-known/jwks.json` };
}

function getJwks(url) {
  if (!clerkJwks) clerkJwks = createRemoteJWKSet(new URL(url));
  return clerkJwks;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST for Gemini problem help." });

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "Gemini is not configured yet. Add GOOGLE_AI_API_KEY to the Vercel project environment variables." });

  const authorization = req.headers.authorization ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Sign in to use Gemini problem help." });

  try {
    const { issuer, jwksUrl } = getClerkConfig();
    const { payload } = await jwtVerify(token, getJwks(jwksUrl), { issuer });
    const requestOrigin = req.headers.origin;
    if (requestOrigin && payload.azp && payload.azp !== requestOrigin) {
      return res.status(403).json({ error: "This sign-in session is not authorized for this site." });
    }
  } catch {
    return res.status(401).json({ error: "Your sign-in session could not be verified. Sign in again and retry." });
  }

  const { problem, status } = req.body ?? {};
  if (
    !problem ||
    typeof problem.title !== "string" || problem.title.length > 180 ||
    typeof problem.pattern !== "string" || problem.pattern.length > 100 ||
    !["Easy", "Medium", "Hard"].includes(problem.difficulty) ||
    !["Todo", "In progress", "Solved"].includes(status)
  ) {
    return res.status(400).json({ error: "The problem details are incomplete." });
  }

  try {
    const geminiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      signal: AbortSignal.timeout(55000),
      body: JSON.stringify({
        model: "gemini-3.8-flash",
        store: false,
        system_instruction: "You are CodexSheet's problem explainer for DSA students and interview analysts. Use simple, direct language. Explain what the problem is asking in one sentence, then provide a first hint, a short numbered approach, what to implement or check next, and the relevant pattern. Do not reveal a full solution or code unless the user explicitly asks. Adapt the first step to the student's status. Do not invent problem constraints that were not provided; tell them to read the linked prompt for exact constraints and examples.",
        input: JSON.stringify({ problem: { title: problem.title, pattern: problem.pattern, difficulty: problem.difficulty, promptUrl: problem.link }, studentStatus: status }),
      }),
    });
    const responseText = await geminiResponse.text();
    let result = {};
    if (responseText.trim()) {
      try {
        result = JSON.parse(responseText);
      } catch {
        return res.status(502).json({ error: "Google Gemini returned an unreadable response. Please try again." });
      }
    } else if (geminiResponse.ok) {
      return res.status(502).json({ error: "Google Gemini returned an empty response. Please try again." });
    }
    if (!geminiResponse.ok) {
      return res.status(geminiResponse.status === 429 ? 429 : 502).json({ error: "Gemini could not answer right now. Please try again shortly." });
    }
    const outputItems = Array.isArray(result.outputs) ? result.outputs : Array.isArray(result.output) ? result.output : [];
    const answer = typeof result.output_text === "string"
      ? result.output_text.trim()
      : outputItems.map((item) => typeof item.text === "string" ? item.text : "").filter(Boolean).join("\n").trim();
    if (!answer) return res.status(502).json({ error: "Gemini returned an empty explanation. Please try again." });
    return res.status(200).json({ answer });
  } catch {
    return res.status(502).json({ error: "Could not reach Google Gemini. Please try again." });
  }
}
