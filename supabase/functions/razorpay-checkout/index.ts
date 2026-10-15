import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const PRICE_PAISE = 1200;
const ALLOWED_TIMES = new Set(["10:00 AM", "2:00 PM", "4:30 PM"]);

type BookingInput = {
  name?: string;
  email?: string;
  date?: string;
  time?: string;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getSupabaseSecretKey() {
  const legacyKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacyKey) return legacyKey;
  const localSecretKey = Deno.env.get("SUPABASE_SECRET_KEY");
  if (localSecretKey) return localSecretKey;
  const keys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!keys) return null;
  try {
    const parsed = JSON.parse(keys) as Record<string, string>;
    return parsed.default ?? null;
  } catch {
    return null;
  }
}

function validateBooking(value: unknown): Required<BookingInput> | null {
  if (!value || typeof value !== "object") return null;
  const booking = value as BookingInput;
  const name = booking.name?.trim() ?? "";
  const email = booking.email?.trim() ?? "";
  const date = booking.date ?? "";
  const time = booking.time ?? "";
  if (name.length < 1 || name.length > 120 || !/^\S+@\S+\.\S+$/.test(email) || email.length > 254) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !ALLOWED_TIMES.has(time)) return null;
  const parsedDate = new Date(`${date}T00:00:00.000Z`);
  if (!Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) return null;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const daysAhead = (parsedDate.getTime() - today.getTime()) / 86_400_000;
  if (daysAhead < 0 || daysAhead > 10) return null;
  return { name, email, date, time };
}

function bytesToHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function paymentSignature(orderId: string, paymentId: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return bytesToHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${orderId}|${paymentId}`)));
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
  const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const supabaseSecret = getSupabaseSecretKey();
  if (!razorpayKeyId || !razorpayKeySecret || !supabaseUrl || !supabaseAnonKey || !supabaseSecret) {
    return json({ error: "Razorpay checkout is not configured on the server." }, 503);
  }

  const authorization = request.headers.get("Authorization");
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!authorization || !accessToken) return json({ error: "Sign in with a valid session before booking." }, 401);
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: authorization } },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(accessToken);
  if (authError || !authData.user) return json({ error: "Sign in with a valid session before booking." }, 401);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }

  const supabase = createClient(supabaseUrl, supabaseSecret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (body.action === "create_order") {
    const booking = validateBooking(body.booking);
    if (!booking) return json({ error: "Booking details are invalid or the selected time has passed." }, 400);

    const { data: savedBooking, error: insertError } = await supabase
      .from("mentor_session_bookings")
      .insert({
        attendee_name: booking.name,
        attendee_email: booking.email,
        session_date: booking.date,
        session_time: booking.time,
        amount_paise: PRICE_PAISE,
        currency: "INR",
        status: "pending",
      })
      .select("id")
      .single();
    if (insertError || !savedBooking) return json({ error: "Could not save this booking request." }, 500);

    const authorization = `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`;
    let orderResponse: Response;
    try {
      orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: { Authorization: authorization, "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: PRICE_PAISE,
          currency: "INR",
          receipt: `mentor_${crypto.randomUUID().replaceAll("-", "").slice(0, 24)}`,
          notes: { booking_id: savedBooking.id },
        }),
      });
    } catch {
      await supabase.from("mentor_session_bookings").delete().eq("id", savedBooking.id);
      return json({ error: "Could not reach Razorpay. Please try again or use direct UPI." }, 502);
    }
    const order = await orderResponse.json().catch(() => ({})) as { id?: string; amount?: number; currency?: string };
    if (!orderResponse.ok || !order.id || order.amount !== PRICE_PAISE || order.currency !== "INR") {
      await supabase.from("mentor_session_bookings").delete().eq("id", savedBooking.id);
      return json({ error: "Razorpay could not create the payment order." }, 502);
    }

    const { error: updateError } = await supabase
      .from("mentor_session_bookings")
      .update({ razorpay_order_id: order.id })
      .eq("id", savedBooking.id);
    if (updateError) {
      await supabase.from("mentor_session_bookings").delete().eq("id", savedBooking.id);
      return json({ error: "The payment order was created but could not be linked to the booking." }, 500);
    }
    return json({ orderId: order.id, amount: PRICE_PAISE, currency: "INR", keyId: razorpayKeyId });
  }

  if (body.action === "verify_payment") {
    const orderId = typeof body.orderId === "string" ? body.orderId : "";
    const paymentId = typeof body.paymentId === "string" ? body.paymentId : "";
    const signature = typeof body.signature === "string" ? body.signature : "";
    if (!orderId || !paymentId || !signature) return json({ error: "Payment verification details are incomplete." }, 400);

    const { data: booking, error: bookingError } = await supabase
      .from("mentor_session_bookings")
      .select("id, amount_paise, currency, status")
      .eq("razorpay_order_id", orderId)
      .maybeSingle();
    if (bookingError || !booking || booking.amount_paise !== PRICE_PAISE || booking.currency !== "INR") {
      return json({ error: "No matching session booking was found for this order." }, 404);
    }

    const expectedSignature = await paymentSignature(orderId, paymentId, razorpayKeySecret);
    if (!safeEqual(expectedSignature, signature)) return json({ error: "Razorpay payment signature is invalid." }, 400);

    let paymentResponse: Response;
    try {
      paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
        headers: { Authorization: `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}` },
      });
    } catch {
      return json({ error: "Could not confirm the payment with Razorpay. Retry verification shortly." }, 502);
    }
    const payment = await paymentResponse.json().catch(() => ({})) as { order_id?: string; amount?: number; currency?: string; status?: string };
    if (!paymentResponse.ok || payment.order_id !== orderId || payment.amount !== PRICE_PAISE || payment.currency !== "INR" || payment.status !== "captured") {
      return json({ error: "Razorpay has not marked this payment as captured yet." }, 409);
    }

    const { error: updateError } = await supabase
      .from("mentor_session_bookings")
      .update({ status: "paid", razorpay_payment_id: paymentId })
      .eq("id", booking.id);
    if (updateError) return json({ error: "Payment was captured, but the booking status could not be updated." }, 500);
    return json({ verified: true, bookingId: booking.id });
  }

  return json({ error: "Unknown checkout action." }, 400);
});
