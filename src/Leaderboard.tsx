// The leaderboard. Everything on it is computed in Postgres from dsa_progress
// joined to the seeded difficulty of each problem number, so a rank cannot be
// padded by relabelling a Hard as an Easy, and a student with nothing solved is
// simply not on the board.
import { useEffect, useState } from "react";
import { Crown, Flame, LoaderCircle, Trophy } from "lucide-react";
import { loadLeaderboard, loadMyStanding, type MyStanding, type StandingRow } from "./dsaRanks";
import "./ranks.css";

const SHEET_LENGTH = 250;

function dayAgo(iso: string) {
  if (!iso) return "";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}

export default function Leaderboard({ userId = "" }: { userId?: string }) {
  const [rows, setRows] = useState<StandingRow[]>([]);
  const [me, setMe] = useState<MyStanding | null>(null);
  const [problem, setProblem] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void Promise.all([loadLeaderboard(60), loadMyStanding()]).then(([board, position]) => {
      if (!alive) return;
      setRows(board.rows);
      setProblem(board.problem);
      setMe(position);
      setLoading(false);
    });
    return () => { alive = false; };
  }, []);

  const lead = rows[0];

  return (
    <section className="rank" aria-labelledby="rank-title">
      <header className="rank-head">
        <span className="rank-kicker">
          <Trophy size={13} /> {loading ? "READING THE BOARD" : `${rows.length} STUDENT${rows.length === 1 ? "" : "S"} ON THE BOARD`} · 250 PROBLEMS
        </span>
        <h1 id="rank-title">Who is actually ahead of you</h1>
        <p>
          Solved problems only, priced the way the sheet prices them: <strong>10 XP</strong> for an Easy,
          {" "}<strong>20</strong> for a Medium, <strong>35</strong> for a Hard. Nothing here is bought,
          Nothing here is bought, streaked or imported from another app - the number moves when a problem is marked solved.
        </p>
      </header>

      {loading ? (
        <p className="rank-loading"><LoaderCircle size={15} className="spin" /> Pulling the standings in from the server…</p>
      ) : (
        <>
          {me && me.signedIn && (
            <div className="rank-you">
              <div>
                <span className="rank-you-label">YOUR STANDING</span>
                <strong className="rank-you-place">
                  {me.place ? `#${me.place}` : "—"}
                  <small>{me.studentsOnBoard > 0 ? `of ${me.studentsOnBoard}` : "not on the board yet"}</small>
                </strong>
              </div>
              <div>
                <span className="rank-you-label">SOLVED</span>
                <strong>{me.solved}<small>/{SHEET_LENGTH}</small></strong>
                <i className="rank-you-track"><b style={{ width: `${Math.min(100, (me.solved / SHEET_LENGTH) * 100)}%` }} /></i>
              </div>
              <div>
                <span className="rank-you-label">XP</span>
                <strong>{me.xp}</strong>
                <span className="rank-you-rank"><Crown size={13} /> {me.rankTitle}</span>
              </div>
              <div>
                <span className="rank-you-label">NEXT RANK</span>
                <strong>{me.xpToNext > 0 ? `${me.xpToNext} XP` : "Top rank held"}</strong>
                {me.xpToNext > 0 && <span className="rank-you-next">to {me.nextTitle}</span>}
              </div>
              {!me.onBoard && (
                <p className="rank-you-note">
                  Your solves are counted the moment they reach the server. Mark a problem solved in the sheet and this row fills in.
                </p>
              )}
            </div>
          )}

          {problem && <p className="rank-problem" role="status">{problem}</p>}

          {rows.length === 0 ? (
            <div className="rank-empty">
              <strong>The board is empty because nobody has a solved problem on the server yet.</strong>
              <p>
                That is the honest version. The sheet is paid and small, so the first students to mark problems
                {" "}solved own the top of it - 250 problems is a lot of ground to cover, and ten solved puts you
                {" "}in front of everyone currently on this page.
              </p>
              <a className="rank-empty-cta" href="/problems">Open the sheet <Flame size={14} /></a>
            </div>
          ) : (
            <ol className="rank-table">
              {rows.map((row) => (
                <li key={row.userId} className={`rank-row${row.place === 1 ? " rank-row-lead" : ""}${row.userId === userId ? " rank-row-me" : ""}`}>
                  <span className="rank-place">{row.place === 1 ? <Crown size={15} /> : row.place}</span>
                  <span className="rank-name">
                    <strong>{row.name}{row.userId === userId && <em>you</em>}</strong>
                    <small>{row.lastSolvedAt ? `last solve ${dayAgo(row.lastSolvedAt)}` : ""}</small>
                  </span>
                  <span className="rank-solved">{row.solved}<small>/{SHEET_LENGTH} solved</small></span>
                  <span className="rank-xp">{row.xp}<small>XP</small></span>
                  <span className="rank-title-cell">{row.rankTitle}</span>
                  <i className="rank-bar" style={{ width: `${lead ? Math.max(6, (row.xp / lead.xp) * 100) : 100}%` }} />
                </li>
              ))}
            </ol>
          )}

          <p className="rank-rules">
            Ties go to whoever got there first. A problem counts once, at the difficulty the sheet gives it, and
            {" "}unmarking a solve takes the XP back off - the board is a record of work, not a scoreboard you can farm.
          </p>
        </>
      )}
    </section>
  );
}
