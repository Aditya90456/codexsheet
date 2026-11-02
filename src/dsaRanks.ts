// dsaRanks.ts — the standings and the paper, both read from the server.
//
// The sheet ranks a student locally from localStorage, but a leaderboard is a
// statement about other people, so it has to come from the one place that knows
// what they actually solved: dsa_progress joined to the seeded difficulties in
// dsa_sheet_problems. The same XP table and rank thresholds as dsaSheet.ts live
// in Postgres as dsa_xp_for() and dsa_rank_title(), minted by
// supabase/migrations/20261101_dsa_leaderboard_certificates.sql.
import { supabase } from "./lib/supabase";

export type StandingRow = {
  place: number;
  userId: string;
  name: string;
  solved: number;
  xp: number;
  rankTitle: string;
  lastSolvedAt: string;
};

export type MyStanding = {
  signedIn: boolean;
  onBoard: boolean;
  solved: number;
  xp: number;
  rankTitle: string;
  place: number | null;
  studentsOnBoard: number;
  nextTitle: string;
  xpToNext: number;
};

export type SheetCertificate = {
  code: string;
  recipientName: string;
  milestone: number;
  solved: number;
  xp: number;
  rankTitle: string;
  issuedAt: string;
};

export type CertificateResult = { ok: boolean; message: string; certificate: SheetCertificate | null };

const emptyStanding: MyStanding = {
  signedIn: false,
  onBoard: false,
  solved: 0,
  xp: 0,
  rankTitle: "Warming up",
  place: null,
  studentsOnBoard: 0,
  nextTitle: "Pattern spotter",
  xpToNext: 100,
};

function asCertificate(value: Record<string, unknown> | null): SheetCertificate | null {
  const code = typeof value?.code === "string" ? value.code : "";
  if (!code) return null;
  return {
    code,
    recipientName: String(value?.recipient_name ?? ""),
    milestone: Number(value?.milestone ?? 0),
    solved: Number(value?.solved ?? 0),
    xp: Number(value?.xp ?? 0),
    rankTitle: String(value?.rank_title ?? ""),
    issuedAt: String(value?.issued_at ?? ""),
  };
}

export async function loadLeaderboard(limit = 40): Promise<{ rows: StandingRow[]; problem: string }> {
  if (!supabase) return { rows: [], problem: "Supabase is not configured, so nobody can be ranked yet." };
  const { data, error } = await supabase.rpc("dsa_leaderboard", { p_limit: limit });
  if (error) return { rows: [], problem: error.message };
  return {
    rows: (data ?? []).map((row: Record<string, unknown>) => ({
      place: Number(row.place),
      userId: String(row.user_id ?? ""),
      name: String(row.display_name ?? "CodexSheet student"),
      solved: Number(row.solved ?? 0),
      xp: Number(row.xp ?? 0),
      rankTitle: String(row.rank_title ?? ""),
      lastSolvedAt: String(row.last_solved_at ?? ""),
    })),
    problem: "",
  };
}

export async function loadMyStanding(): Promise<MyStanding> {
  if (!supabase) return emptyStanding;
  const { data, error } = await supabase.rpc("dsa_my_position");
  if (error || !data) return emptyStanding;
  const value = data as Record<string, unknown>;
  return {
    signedIn: Boolean(value.signed_in),
    onBoard: Boolean(value.on_board),
    solved: Number(value.solved ?? 0),
    xp: Number(value.xp ?? 0),
    rankTitle: String(value.rank_title ?? "Warming up"),
    place: value.place === null || value.place === undefined ? null : Number(value.place),
    studentsOnBoard: Number(value.students_on_board ?? 0),
    nextTitle: String(value.next_title ?? ""),
    xpToNext: Number(value.xp_to_next ?? 0),
  };
}

export async function loadMyCertificates(userId: string): Promise<{ rows: SheetCertificate[]; problem: string }> {
  if (!supabase || !userId) return { rows: [], problem: "" };
  const { data, error } = await supabase
    .from("dsa_certificates")
    .select("*")
    .eq("user_id", userId)
    .order("milestone", { ascending: false });
  if (error) return { rows: [], problem: error.message };
  return { rows: (data ?? []).map((row) => asCertificate(row as Record<string, unknown>)).filter(Boolean) as SheetCertificate[], problem: "" };
}

export async function mintCertificate(): Promise<CertificateResult> {
  if (!supabase) return { ok: false, message: "CodexSheet cannot print a certificate right now - Supabase is not configured.", certificate: null };
  const { data, error } = await supabase.rpc("issue_dsa_certificate");
  if (error) return { ok: false, message: error.message, certificate: null };
  const value = (data ?? {}) as Record<string, unknown>;
  return {
    ok: Boolean(value.ok),
    message: String(value.message ?? "The certificate could not be minted."),
    certificate: asCertificate(value),
  };
}

export async function verifyCertificate(code: string): Promise<CertificateResult> {
  const trimmed = code.trim();
  if (!trimmed) return { ok: false, message: "Type the code printed under the name on the certificate.", certificate: null };
  if (!supabase) return { ok: false, message: "CodexSheet cannot check a code right now - Supabase is not configured.", certificate: null };
  const { data, error } = await supabase.rpc("verify_dsa_certificate", { p_code: trimmed });
  if (error) return { ok: false, message: error.message, certificate: null };
  const value = (data ?? {}) as Record<string, unknown>;
  return {
    ok: Boolean(value.ok),
    message: String(value.message ?? "That code could not be checked."),
    certificate: asCertificate(value),
  };
}
