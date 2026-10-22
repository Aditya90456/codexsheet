const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getVerifiedUserId(request: Request) {
  // Supabase's Edge gateway verifies the Clerk JWT before invoking this function.
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(base64)) as { sub?: string; role?: string };
    return claims.role === "authenticated" && claims.sub ? claims.sub : null;
  } catch {
    return null;
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  const userId = getVerifiedUserId(request);
  if (!userId) return json({ error: "Sign in to get call connection settings." }, 401);

  const urls = (Deno.env.get("TURN_URLS") ?? "").split(",").map((url) => url.trim()).filter(Boolean);
  const sharedSecret = Deno.env.get("TURN_SHARED_SECRET");
  if (urls.length === 0 || !sharedSecret) {
    console.error("Call TURN settings are missing from the Edge Function environment.");
    return json({ error: "Call connection service is not configured." }, 503);
  }

  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60;
  const username = `${expiresAt}:${userId}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(sharedSecret),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(username)));
  const credential = btoa(String.fromCharCode(...signature));

  return json({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls, username, credential },
    ],
    expiresAt,
  });
});
