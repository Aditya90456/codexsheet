// The certificate, and the page that checks one.
//
// A certificate here is a receipt for work, not a product: the paper can only be
// minted from solved counts the server already has, it starts at a quarter of the
// sheet, and the numbers are frozen into the row when it is issued. The verify page
// is deliberately public and code-only - an interviewer can check the paper a
// candidate shows them without signing up, and nobody can list who holds one.
import { useEffect, useRef, useState } from "react";
import { BadgeCheck, LoaderCircle, Printer, ScrollText, Search, ShieldCheck, X } from "lucide-react";
import {
  loadMyCertificates,
  loadMyStanding,
  mintCertificate,
  verifyCertificate,
  type SheetCertificate,
} from "./dsaRanks";
import "./ranks.css";

const MILESTONES = [25, 50, 100, 150, 200, 250];
const SHEET_LENGTH = 250;

const issuedOn = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }) : "";

function nextMilestone(solved: number) {
  return MILESTONES.find((milestone) => milestone > solved) ?? null;
}

function CertificatePaper({ certificate }: { certificate: SheetCertificate }) {
  const paper = useRef<HTMLDivElement>(null);

  function print() {
    const node = paper.current;
    if (!node) return;
    node.classList.add("cert-printing");
    const clear = () => node.classList.remove("cert-printing");
    window.addEventListener("afterprint", clear, { once: true });
    window.print();
    window.setTimeout(clear, 30_000);
  }

  return (
    <div className="cert-paper" ref={paper}>
      <div className="cert-paper-inner">
        <span className="cert-eyebrow">CODEXSHEET · CERTIFICATE OF DSA PRACTICE</span>
        <h3 className="cert-recipient">{certificate.recipientName}</h3>
        <p className="cert-claim">
          has marked <strong>{certificate.solved}</strong> of the {SHEET_LENGTH} problems on the CodexSheet DSA
          problem sheet as solved, at {certificate.xp} XP, holding the rank <strong>{certificate.rankTitle}</strong>.
        </p>
        <p className="cert-milestone">Milestone · {certificate.milestone} solved</p>
        <dl className="cert-facts">
          <div><dt>Issued</dt><dd>{issuedOn(certificate.issuedAt)}</dd></div>
          <div><dt>Verification code</dt><dd className="cert-code">{certificate.code}</dd></div>
          <div><dt>Check it at</dt><dd>codexsheet.in/verify?code={certificate.code}</dd></div>
        </dl>
        <div className="cert-seal" aria-hidden="true">
          <ShieldCheck size={26} />
          <span>SOLVED ON<br />THE SHEET</span>
        </div>
        <p className="cert-foot">
          CodexSheet records what was solved, when, and at which difficulty the sheet labels it. This paper is a
          receipt for that work and nothing else.
        </p>
      </div>
      <button type="button" className="cert-print secondary-button cert-no-print" onClick={print}>
        <Printer size={14} /> Print this certificate
      </button>
    </div>
  );
}

export default function Certificates({ userId = "" }: { userId?: string }) {
  const [rows, setRows] = useState<SheetCertificate[]>([]);
  const [solved, setSolved] = useState(0);
  const [xp, setXp] = useState(0);
  const [rankTitle, setRankTitle] = useState("Warming up");
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    void Promise.all([loadMyCertificates(userId), loadMyStanding()]).then(([mine, standing]) => {
      if (!alive) return;
      setRows(mine.rows);
      setSolved(standing.solved);
      setXp(standing.xp);
      setRankTitle(standing.rankTitle);
      setReady(true);
    });
    return () => { alive = false; };
  }, [userId]);

  async function mint() {
    setBusy(true);
    const result = await mintCertificate();
    setBusy(false);
    setNotice({ ok: result.ok, message: result.message });
    if (result.ok && result.certificate) {
      setRows((current) => [
        result.certificate as SheetCertificate,
        ...current.filter((row) => row.code !== result.certificate?.code),
      ]);
    }
  }

  const target = nextMilestone(solved);
  const held = new Set(rows.map((row) => row.milestone));

  return (
    <section className="rank cert" aria-labelledby="cert-title">
      <header className="rank-head">
        <span className="rank-kicker"><ScrollText size={13} /> {rows.length} ON FILE · MINTED FROM REAL SOLVES</span>
        <h1 id="cert-title">Paper for the work you actually did</h1>
        <p>
          A CodexSheet certificate is issued at a quarter of the sheet and then at every 50 after it, from the
          {" "}<strong>{solved}</strong> problems the server has recorded as solved for this account. The counts are
          {" "}frozen when the paper is minted, so it says what was true on that day - and the code on it can be
          checked by anyone, without signing in.
        </p>
      </header>

      <div className="cert-track">
        {MILESTONES.map((milestone) => (
          <span key={milestone} className={`cert-step${held.has(milestone) ? " held" : ""}${milestone === target ? " next" : ""}`}>
            <strong>{milestone}</strong>
            <small>{held.has(milestone) ? "issued" : milestone === target ? `${milestone - solved} to go` : "locked"}</small>
          </span>
        ))}
      </div>

      <div className="cert-mint">
        <div>
          <span className="insight-label">CURRENTLY ON THE SERVER</span>
          <strong>{solved}<small>/{SHEET_LENGTH} solved · {xp} XP · {rankTitle}</small></strong>
          <p>
            {target
              ? `${target - solved} more solved and the ${target}-problem certificate is yours to print.`
              : solved >= SHEET_LENGTH
                ? "The whole sheet. There is nothing left on this page to unlock."
                : "The next milestone is already on file - keep going for the one after it."}
          </p>
        </div>
        <button type="button" className="primary-button" onClick={() => void mint()} disabled={busy || solved < MILESTONES[0]}>
          {busy ? <LoaderCircle size={14} className="spin" /> : <BadgeCheck size={14} />}
          {solved < MILESTONES[0] ? `Solve ${MILESTONES[0]} to unlock` : "Mint my certificate"}
        </button>
      </div>

      {notice && (
        <p className={`cert-notice ${notice.ok ? "good" : "bad"}`} role="status">
          {notice.ok ? <BadgeCheck size={14} /> : <X size={14} />} {notice.message}
        </p>
      )}

      {!ready ? (
        <p className="rank-loading"><LoaderCircle size={15} className="spin" /> Reading your certificates…</p>
      ) : rows.length === 0 ? (
        <div className="rank-empty">
          <strong>No certificate on this account yet.</strong>
          <p>
            Nothing here is for sale and nothing is issued for signing up. Solve a quarter of the sheet -
            {" "}25 problems marked solved in the sheet itself - and the first paper prints from this page.
          </p>
          <a className="rank-empty-cta" href="/problems">Open the sheet</a>
        </div>
      ) : (
        <div className="cert-papers">
          {rows.map((certificate) => (
            <CertificatePaper key={certificate.code} certificate={certificate} />
          ))}
        </div>
      )}

      <p className="rank-rules">
        Someone verifying a paper needs only the code printed on it:{" "}
        <a href="/verify">codexsheet.in/verify</a>. It returns the name, the milestone and the day it was issued -
        never a list of who holds a certificate.
      </p>
    </section>
  );
}

export function VerifyPage() {
  const [code, setCode] = useState(() => new URLSearchParams(window.location.search).get("code") ?? "");
  const [result, setResult] = useState<{ ok: boolean; message: string; certificate: SheetCertificate | null } | null>(null);
  const [busy, setBusy] = useState(false);

  async function check(value: string) {
    setBusy(true);
    setResult(await verifyCertificate(value));
    setBusy(false);
  }

  useEffect(() => {
    if (code.trim()) void check(code);
    // Only on load: a code in the address bar is the whole reason the page exists.
  }, []);

  return (
    <section className="rank cert cert-verify" aria-labelledby="verify-title">
      <header className="rank-head">
        <span className="rank-kicker"><Search size={13} /> PUBLIC VERIFIER · NO ACCOUNT NEEDED</span>
        <h1 id="verify-title">Is that CodexSheet certificate real?</h1>
        <p>
          Type the code printed under the name on the paper. It looks like <strong>CS-1A2B3C4D</strong>. A certificate
          {" "}is only minted from problems the server recorded as solved, so a verified code means the work was done
          {" "}on this sheet on that date.
        </p>
      </header>

      <form
        className="cert-verify-form"
        onSubmit={(event) => {
          event.preventDefault();
          void check(code);
        }}
      >
        <label htmlFor="cert-verify-code">Certificate code</label>
        <input
          id="cert-verify-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="CS-1A2B3C4D"
          autoComplete="off"
          spellCheck={false}
        />
        <button type="submit" className="primary-button" disabled={busy}>
          {busy ? <LoaderCircle size={14} className="spin" /> : <Search size={14} />} Verify
        </button>
      </form>

      {result && (
        <div className={`cert-result${result.ok ? " good" : " bad"}`} role="status">
          {result.ok && result.certificate ? (
            <>
              <p className="cert-result-message"><BadgeCheck size={15} /> {result.message}</p>
              <CertificatePaper certificate={result.certificate} />
            </>
          ) : (
            <p className="cert-result-message"><X size={15} /> {result.message}</p>
          )}
        </div>
      )}
    </section>
  );
}
