import { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { EditorView } from "@codemirror/view";
import { AlertCircle, Check, ChevronRight, Clock3, Crown, LoaderCircle, Play, Sparkles, Trophy } from "lucide-react";
import { battleCharacters, battleCharacterStorageKey, characterAvatarSrc, readBattleCharacter } from "./HumanVsAi";
import { playoffQuestions, qualifierQuestions, type TournamentQuestion } from "./tournamentQuestions";
import "./tournament.css";

const teams = [
  "Chennai Super Kings",
  "Mumbai Indians",
  "Kolkata Knight Riders",
  "Royal Challengers Bengaluru",
  "Sunrisers Hyderabad",
  "Rajasthan Royals",
  "Delhi Capitals",
  "Punjab Kings",
  "Gujarat Titans",
];
const rounds: TournamentQuestion[] = [...qualifierQuestions, ...playoffQuestions];

type Score = { passed_cases: number; total_cases: number; runtime_ms: number; statuses: string[] };
type RoundResult = { round: number; student: Score; ai: Score; student_code: string; ai_code: string; ai_explanation: string; winner: "student" | "ai" | "draw" };

function starter(question: TournamentQuestion) {
  return [
    'const fs = require("fs");',
    'const input = fs.readFileSync(0, "utf8").trim().split(/\\s+/);',
    "",
    `// Solve: ${question.title}`,
    "// Print the required answer to stdout.",
    "",
  ].join("\n");
}

function compareLabel(winner: RoundResult["winner"]) {
  return winner === "student" ? "You won this round" : winner === "ai" ? "AI won this round" : "Round tied";
}

export default function TournamentPage() {
  const [characterId, setCharacterId] = useState(readBattleCharacter);
  const [roundNumber, setRoundNumber] = useState(1);
  const [code, setCode] = useState(() => starter(rounds[0]));
  const [results, setResults] = useState<RoundResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const character = battleCharacters.find((entry) => entry.id === characterId) ?? battleCharacters[0];
  const question = rounds[roundNumber - 1];
  const team = teams[roundNumber - 1];
  const roundResult = results.find((result) => result.round === roundNumber);
  const studentWins = results.filter((result) => result.winner === "student").length;
  const aiWins = results.filter((result) => result.winner === "ai").length;
  const totalRounds = rounds.length;

  function chooseCharacter(nextId: string) {
    if (busy || !battleCharacters.some((entry) => entry.id === nextId)) return;
    setCharacterId(nextId);
    try {
      window.localStorage.setItem(battleCharacterStorageKey, nextId);
    } catch {
      setError("Your character choice could not be saved on this device.");
    }
  }

  async function submitRound() {
    if (busy || !question || !code.trim()) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/student-tournament", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          round: roundNumber,
          team,
          question_id: question.id,
          source_code: code,
        }),
        signal: AbortSignal.timeout(60_000),
      });
      const result = await response.json() as {
        error?: string;
        student?: Score;
        ai?: Score;
        ai_code?: string;
        ai_explanation?: string;
        winner?: RoundResult["winner"];
      };
      if (!response.ok) throw new Error(result.error ?? "This round could not be judged.");
      const winner = result.winner;
      if (
        !result.student
        || !result.ai
        || !result.ai_code
        || !result.ai_explanation
        || (winner !== "student" && winner !== "ai" && winner !== "draw")
      ) {
        throw new Error("The tournament judge returned an incomplete result.");
      }
      const roundResult: RoundResult = {
        round: roundNumber,
        student: result.student,
        ai: result.ai,
        student_code: code,
        ai_code: result.ai_code,
        ai_explanation: result.ai_explanation,
        winner,
      };
      setResults((current) => [...current.filter((entry) => entry.round !== roundNumber), roundResult]);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "The round could not be completed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function continueToNextRound() {
    if (roundNumber >= totalRounds || !roundResult) return;
    const nextRound = roundNumber + 1;
    setRoundNumber(nextRound);
    setCode(starter(rounds[nextRound - 1]));
    setError("");
  }

  function restartTournament() {
    setRoundNumber(1);
    setCode(starter(rounds[0]));
    setResults([]);
    setError("");
  }

  return (
    <main className="tournament-page">
      <header className="tournament-hero">
        <div>
          <a className="tournament-back" href="/battle"><ChevronRight size={13} /> Back to CodexSheet Battle</a>
          <span className="tournament-kicker"><Trophy size={14} /> CODEXSHEET STUDENT TOURNAMENT</span>
          <h1>Free JavaScript coding tournament for students.</h1>
          <p>Solve nine DSA challenges, compete against AI opponents, then compare hidden-test results, code, and a concise solution approach summary.</p>
        </div>
        <div className="tournament-format"><strong>IPL-STYLE LEAGUE</strong><span>9 rounds · 9 AI teams · JavaScript</span></div>
      </header>

      {error && <p className="tournament-message error" role="alert"><AlertCircle size={15} />{error}</p>}

      <section className="tournament-character-panel tournament-panel">
        <div className="tournament-character-intro">
          <img src={characterAvatarSrc(character)} alt="" aria-hidden="true" />
          <div>
            <span className="tournament-eyebrow">YOUR CHARACTER</span>
            <h2>{character.name}</h2>
            <p>Choose your avatar, then represent it in all nine rounds. IPL team names are used as playful AI opponents.</p>
          </div>
        </div>
        <div className="tournament-character-grid" role="group" aria-label="Choose your tournament character">
          {battleCharacters.map((item) => (
            <button key={item.id} type="button" className={item.id === characterId ? "selected" : ""} aria-pressed={item.id === characterId} onClick={() => chooseCharacter(item.id)} disabled={busy}>
              <img src={characterAvatarSrc(item)} alt="" aria-hidden="true" loading="lazy" />
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="tournament-scorebar" aria-label="Tournament score">
        <div><span className="tournament-eyebrow">YOUR SCORE</span><strong>{studentWins}</strong></div>
        <span className="tournament-score-vs">VS</span>
        <div><span className="tournament-eyebrow">AI SCORE</span><strong>{aiWins}</strong></div>
        <span className="tournament-round-progress">ROUND {Math.min(roundNumber, totalRounds)} / {totalRounds}</span>
      </section>

      {roundNumber > totalRounds ? (
        <section className="tournament-panel tournament-finished">
          <Trophy size={25} />
          <div><span className="tournament-eyebrow">LEAGUE COMPLETE</span><h2>{studentWins > aiWins ? "You topped the table!" : studentWins === aiWins ? "A tied league finish!" : "The AI takes the league."}</h2><p>You won {studentWins} of 9 rounds. Revisit the solutions above to review how each approach works.</p></div>
          <button type="button" onClick={restartTournament}>Play again</button>
        </section>
      ) : (
        <section className="tournament-round">
          <div className="tournament-round-header">
            <div className="tournament-round-title">
              <span className="tournament-eyebrow">ROUND {roundNumber} · {team.toUpperCase()}</span>
              <h2>{question.title}</h2>
            </div>
            <span className={`tournament-difficulty ${question.difficulty.toLowerCase()}`}>{question.difficulty}</span>
          </div>

          <div className="tournament-round-grid">
            <article className="tournament-panel tournament-problem">
              <p>{question.statement}</p>
              <h3>Input</h3><p>{question.input}</p>
              <h3>Output</h3><p>{question.output}</p>
              <h3>Constraints</h3><ul>{question.constraints.map((constraint) => <li key={constraint}>{constraint}</li>)}</ul>
              {question.examples.map((example, index) => <div className="tournament-example" key={index}><span>EXAMPLE {index + 1}</span><pre>{example.stdin}</pre><strong>Output: {example.stdout}</strong></div>)}
              <div className="tournament-opponent"><Crown size={15} /><span>Your AI opponent is <strong>{team}</strong></span></div>
            </article>

            <article className="tournament-panel tournament-editor tournament-student-editor">
              <div className="tournament-editor-head"><label>Your JavaScript solution</label><span><Clock3 size={12} /> Match all hidden tests to win</span></div>
              <CodeMirror
                value={code}
                height="410px"
                extensions={[javascript(), EditorView.lineWrapping]}
                onChange={setCode}
                readOnly={busy}
                basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: true, bracketMatching: true }}
                aria-label={`Round ${roundNumber} JavaScript solution`}
              />
              <div className="tournament-submit-row">
                <span>{code.length.toLocaleString()} characters</span>
                <button type="button" onClick={() => void submitRound()} disabled={busy || !code.trim()}>
                  {busy ? <><LoaderCircle size={15} className="tournament-spin" /> The AI is solving and both are being judged…</> : <><Play size={15} /> {roundResult ? "Submit improved solution" : "Submit and compare"}</>}
                </button>
              </div>
            </article>

            <article className="tournament-panel tournament-editor tournament-ai-editor" aria-label="AI opponent JavaScript solution">
              <div className="tournament-editor-head">
                <label>{team} AI JavaScript solution</label>
                <span><Sparkles size={12} />{roundResult ? "Read-only solution" : busy ? "AI is solving…" : "Revealed after submission"}</span>
              </div>
              <CodeMirror
                value={roundResult?.ai_code ?? `// ${busy ? "The AI is preparing a solution…" : "Submit your solution to reveal the AI code."}`}
                height="410px"
                extensions={[javascript(), EditorView.lineWrapping]}
                readOnly
                basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: true, bracketMatching: true }}
                aria-label={`Read-only ${team} AI JavaScript solution`}
              />
              <div className="tournament-ai-editor-foot">
                {roundResult
                  ? <span>{roundResult.ai.passed_cases}/{roundResult.ai.total_cases} hidden tests passed</span>
                  : <span>The AI solution appears here after the round is judged.</span>}
              </div>
            </article>
          </div>

          {roundResult && (
            <section className="tournament-result">
              <div className="tournament-result-banner">
                {roundResult.winner === "student" ? <Check size={18} /> : roundResult.winner === "draw" ? <Sparkles size={18} /> : <Trophy size={18} />}
                <div><strong>{compareLabel(roundResult.winner)}</strong><span>You {roundResult.student.passed_cases}/{roundResult.student.total_cases} tests · {team} AI {roundResult.ai.passed_cases}/{roundResult.ai.total_cases} tests</span></div>
              </div>
              <details open>
                <summary>AI approach summary · {team}</summary>
                <p>A concise explanation of the algorithm and its complexity—not the AI’s private internal reasoning.</p>
                <pre className="tournament-ai-notes">{roundResult.ai_explanation}</pre>
              </details>
              <div className="tournament-result-actions">
                <span>AI runtime: {roundResult.ai.runtime_ms} ms · Your runtime: {roundResult.student.runtime_ms} ms</span>
                {roundNumber < totalRounds
                  ? <button type="button" onClick={continueToNextRound}>Next round <ChevronRight size={14} /></button>
                  : <button type="button" onClick={() => setRoundNumber(totalRounds + 1)}>Finish league <Trophy size={14} /></button>}
              </div>
            </section>
          )}
        </section>
      )}

      <section className="tournament-league">
        <div className="tournament-section-heading"><div><span className="tournament-eyebrow">FIXTURES</span><h2>Nine-round league</h2></div><small>One new problem each round</small></div>
        <ol>
          {teams.map((teamName, index) => {
            const result = results.find((entry) => entry.round === index + 1);
            return <li key={teamName} className={`${index + 1 === roundNumber ? "current" : ""}${result ? ` ${result.winner}` : ""}`}>
              <span>{String(index + 1).padStart(2, "0")}</span><strong>{teamName}</strong><small>{rounds[index].title}</small>
              <em>{result ? compareLabel(result.winner) : index + 1 === roundNumber ? "Playing now" : "Upcoming"}</em>
            </li>;
          })}
        </ol>
        <p className="tournament-disclaimer">IPL team names are used only as playful opponent labels. CodexSheet is not affiliated with the teams or league.</p>
      </section>

      {results.some((result) => result.round !== roundNumber) && (
        <section className="tournament-reviews">
          <div className="tournament-section-heading"><div><span className="tournament-eyebrow">LEARNING REPLAY</span><h2>Review completed rounds</h2></div></div>
          {results.filter((result) => result.round !== roundNumber).sort((a, b) => a.round - b.round).map((result) => (
            <details key={result.round}>
              <summary>Round {result.round} · {teams[result.round - 1]} · {compareLabel(result.winner)} · {result.student.passed_cases}/{result.student.total_cases} tests</summary>
              <pre className="tournament-ai-notes">{result.ai_explanation}</pre>
              <div className="tournament-solution-compare">
                <div><strong>Your submitted code</strong><pre>{result.student_code}</pre></div>
                <div><strong>{teams[result.round - 1]} AI code</strong><pre>{result.ai_code}</pre></div>
              </div>
            </details>
          ))}
        </section>
      )}
    </main>
  );
}
