// The 2027 interview radar: what the round structure is turning into, and the
// questions that are actually being asked in it.
//
// Two rules this file keeps, because breaking either one makes the page a lie:
//   1. Nothing goes in here without a source we read. `url` is the write-up the
//      question came from, and `confidence` says whether that write-up is the
//      company itself (`first_party`) or somebody reporting about it (`reported`).
//   2. Reported claims about a named company's rules are marked as needing a
//      check with the recruiter. Third-party lists of who bans AI in interviews
//      are months out of date by the time they are published, and a candidate
//      who trusts them in the room is the one who loses.
//
// This is deliberately not a leaked-question bank. Nobody can promise a student
// what Amazon will ask in March; what can be shown is which rounds are changing
// and what each new round is probing.

export type RadarRoundId =
  | "ai_pairing"
  | "code_reading"
  | "project_defence"
  | "ai_system_design"
  | "applied_ai"
  | "behavioural"
  | "dsa_core";

export type RadarRound = {
  id: RadarRoundId;
  name: string;
  /** What happens in the room, in one line a student can repeat to themselves. */
  blurb: string;
  /** Who is running this round today. */
  who: string;
};

export type RadarQuestion = {
  id: string;
  round: RadarRoundId;
  /** The question as it gets said out loud. */
  ask: string;
  /** What the interviewer is actually measuring. */
  probes: string;
  /** What a strong answer does, in the order it should be done. */
  strong: string;
  /** The mistake that reads as junior. */
  trap: string;
  source: string;
  url: string;
  confidence: "first_party" | "reported";
  /** Pattern cards on this site worth drilling before this one lands. */
  patterns?: string[];
};

export const radarCompiledOn = "5 November 2026";

export const radarRounds: RadarRound[] = [
  {
    id: "ai_pairing",
    name: "The AI-pairing round",
    blurb: "You are handed an assistant and an ambiguous task, and watched while you use it.",
    who: "Started at Canva, which made it the replacement for its CS-fundamentals round; reported at Meta and elsewhere in the 2026 cycle.",
  },
  {
    id: "code_reading",
    name: "Reading code you did not write",
    blurb: "An unfamiliar file, a slow endpoint, or a diff that must not break anything.",
    who: "The skill AI-generated output made urgent - most of the code you will own is written by nobody you can interrogate.",
  },
  {
    id: "project_defence",
    name: "Defending your own build",
    blurb: "Your resume project, taken apart: why that design, what breaks at scale, what you would redo.",
    who: "Every tier. It is the one round that cannot be prepared for by memorising, because the subject is your work.",
  },
  {
    id: "ai_system_design",
    name: "Designing around a model",
    blurb: "Design the RAG service, the copilot, the agent with memory - and say how you would know it works.",
    who: "AI engineer and platform-team loops; spreading into SDE-1 design rounds at product companies that ship AI features.",
  },
  {
    id: "applied_ai",
    name: "Applied-AI depth",
    blurb: "Retrieval versus fine-tuning, evals, token cost, latency, tool protocols.",
    who: "Named rounds at AI-product companies; the same questions show up as one drill inside a normal SDE loop.",
  },
  {
    id: "behavioural",
    name: "Behavioural, in the AI era",
    blurb: "STAR stories, plus how you actually work with a model on your desk.",
    who: "HR and hiring-manager round at every tier; Amazon weights it as heavily as the technical ones.",
  },
  {
    id: "dsa_core",
    name: "DSA, still the gate",
    blurb: "The elimination round: pattern recognition under a clock, on problems with one right answer.",
    who: "Mid-size product companies and Indian placement drives, per a read of 50 live job postings - startups mostly dropped it, product companies did not.",
  },
];

export const radarQuestions: RadarQuestion[] = [
  // ── The AI-pairing round ────────────────────────────────────────────────────
  {
    id: "ai-1",
    round: "ai_pairing",
    ask: "The AI wrote this function. What is wrong with it?",
    probes: "Whether you read generated code at all, and whether you read it for the boundary rather than the happy path.",
    strong: "Say what the function promises, then walk the edges in order: empty input, one element, the maximum, duplicates, negative or unhashable types, concurrent callers. Name the first line that is wrong and why, then state the smallest change that fixes it. Finish with the test you would add so the bug cannot come back.",
    trap: "Declaring it looks fine. Interviewers write these seeds deliberately - missing the planted bug reads as someone who ships model output unread.",
    source: "Avi Vashishta, “What 2027 Interviews Will Actually Ask You” (question 1)",
    url: "https://www.avivashishta.com/blog/what-2027-interviews-will-actually-ask",
    confidence: "reported",
  },
  {
    id: "ai-2",
    round: "ai_pairing",
    ask: "Solve this with the assistant, and talk me through your prompts.",
    probes: "Narration. Can you decompose a vague ask, and can you explain a step you did not write yourself.",
    strong: "Restate the task out loud before typing anything, list the assumptions you are about to make, then prompt in pieces: data shape first, core loop second, edge handling third. When it returns something, say why you accepted or rejected it. If it goes sideways, show the correction rather than hiding it.",
    trap: "Prompting once with the whole problem, pasting the answer, then being unable to explain line 12. Silent success scores lower than a narrated mess.",
    source: "Avi Vashishta, “What 2027 Interviews Will Actually Ask You” (question 2)",
    url: "https://www.avivashishta.com/blog/what-2027-interviews-will-actually-ask",
    confidence: "reported",
  },
  {
    id: "ai-3",
    round: "ai_pairing",
    ask: "How do you know this output is correct?",
    probes: "Your verification reflex - the thing that separates a reviewable engineer from a paste button.",
    strong: "Give a concrete oracle, not confidence. Property you can check, a brute-force version on small inputs, a hand-worked example, or a golden test. Say what would still slip through those checks and how you would watch it in production.",
    trap: "“It ran on the sample.” A sample is not an oracle; the assistant passing the visible case is the weakest evidence there is.",
    source: "Avi Vashishta, “What 2027 Interviews Will Actually Ask You” (question 3)",
    url: "https://www.avivashishta.com/blog/what-2027-interviews-will-actually-ask",
    confidence: "reported",
  },
  {
    id: "ai-4",
    round: "ai_pairing",
    ask: "What would you never let an AI do without checking?",
    probes: "Judgement about blast radius: migrations, deletes, auth, secrets, anything irreversible.",
    strong: "Pick two or three classes where you require a human - schema migrations and data deletion because they are hard to reverse, auth and permission code because a plausible wrong answer is a breach, dependency bumps because they widen the supply chain. For each, say what your check actually is.",
    trap: "A blanket “I review everything” with no ordering. Review-all is not a policy; the question is asking what you prioritise when you cannot read it all.",
    source: "Avi Vashishta, “What 2027 Interviews Will Actually Ask You” (question 4)",
    url: "https://www.avivashishta.com/blog/what-2027-interviews-will-actually-ask",
    confidence: "reported",
  },
  {
    id: "ai-5",
    round: "ai_pairing",
    ask: "You are told, before the call, that AI use is expected here. The task is ambiguous on purpose.",
    probes: "Canva scores five things: how you leverage the tool, how you break the requirement down, the technical decisions you take, whether you catch the problems in the generated code, and whether you hold it to a production bar.",
    strong: "Ask two clarifying questions up front, since ambiguity is the design of the round and not an accident. Write the smallest failing test before you generate anything. Keep one visible decision log: what you chose, what you rejected, what it costs. End by naming the gap you would close if you had another hour.",
    trap: "Treating the ambiguity as noise and answering the question you wished they had asked. Canva moved to this format precisely because models now solve the old well-specified questions trivially.",
    source: "Canva Engineering, “Yes, You Can Use AI in Our Interviews. In fact, we insist”",
    url: "https://www.canva.dev/blog/engineering/yes-you-can-use-ai-in-our-interviews/",
    confidence: "first_party",
  },

  // ── Reading code you did not write ─────────────────────────────────────────
  {
    id: "read-1",
    round: "code_reading",
    ask: "Here is a codebase you have never seen. Find the bug.",
    probes: "Triage under unfamiliarity: do you read the entry point and the tests, or start scrolling at random.",
    strong: "Orient first - language, entry point, where the output is produced. Then reproduce with the smallest input that shows the symptom, and read only the path that input travels. State the failing assumption, then the fix. Mention the test that would have caught it.",
    trap: "Reading top-to-bottom through 40 files looking for a wrong character. Interviewers score the search strategy far more than the find.",
    source: "Avi Vashishta, “What 2027 Interviews Will Actually Ask You” (question 5)",
    url: "https://www.avivashishta.com/blog/what-2027-interviews-will-actually-ask",
    confidence: "reported",
    patterns: ["Arrays & Hashing"],
  },
  {
    id: "read-2",
    round: "code_reading",
    ask: "This endpoint is slow. How would you find out why?",
    probes: "Whether you measure before you optimise, and whether you know where time actually goes.",
    strong: "Split the request: queue, compute, database, network, downstream. Say what you would look at for each - timing headers, one EXPLAIN ANALYZE on the suspected query, N+1 in the ORM log, payload size, cold starts. Then commit to the cheapest measurement that discriminates between them.",
    trap: "Jumping to caching, or to rewriting in another language, without a number. Premature optimisation is the answer this question exists to catch.",
    source: "Avi Vashishta, “What 2027 Interviews Will Actually Ask You” (question 6)",
    url: "https://www.avivashishta.com/blog/what-2027-interviews-will-actually-ask",
    confidence: "reported",
  },
  {
    id: "read-3",
    round: "code_reading",
    ask: "Refactor this without breaking anything.",
    probes: "Whether you change behaviour and structure in one step, and whether you can prove the step was safe.",
    strong: "Pin the current behaviour first: characterisation tests on the inputs you can reach, including the ugly ones. Refactor in small commits that keep the tests green, and say out loud which ones you would land separately for review. Name the thing you deliberately left alone.",
    trap: "Rewriting it in one go and calling it cleaner. With no oracle for the old behaviour, a big-bang refactor is an unproven claim.",
    source: "Avi Vashishta, “What 2027 Interviews Will Actually Ask You” (question 7)",
    url: "https://www.avivashishta.com/blog/what-2027-interviews-will-actually-ask",
    confidence: "reported",
  },

  // ── Defending your own build ───────────────────────────────────────────────
  {
    id: "proj-1",
    round: "project_defence",
    ask: "Why did you choose this architecture?",
    probes: "Whether the decisions on your resume were decisions, or defaults you inherited from a tutorial.",
    strong: "Name the constraint that mattered, the two alternatives you considered, and the cost you accepted. Monolith because two people and one deploy target. Postgres because relational reads and one database you can back up. Say honestly what you would have chosen if scale were the constraint.",
    trap: "Defending the choice as optimal. Claiming you had no alternatives reads as having made no decision.",
    source: "Avi Vashishta, “What 2027 Interviews Will Actually Ask You” (question 8)",
    url: "https://www.avivashishta.com/blog/what-2027-interviews-will-actually-ask",
    confidence: "reported",
  },
  {
    id: "proj-2",
    round: "project_defence",
    ask: "How did you handle authentication?",
    probes: "Session versus token, where the secret lives, what happens on refresh and on logout. Security is now a junior-level question because assistants scaffold it wrongly by default.",
    strong: "Describe the actual flow: where credentials are verified, what is issued, where it is stored, how it is sent, how it expires, how a revoked token stops working. Then name one thing you got wrong or would harden - httpOnly cookie over localStorage, short access token plus refresh rotation, server-side session revocation.",
    trap: "“I used a library for auth.” That is fine engineering and a non-answer; they are asking whether you understand the state machine you delegated.",
    source: "Avi Vashishta, “What 2027 Interviews Will Actually Ask You” (question 9)",
    url: "https://www.avivashishta.com/blog/what-2027-interviews-will-actually-ask",
    confidence: "reported",
  },
  {
    id: "proj-3",
    round: "project_defence",
    ask: "What happens when 10,000 users hit your app at once?",
    probes: "Where your design breaks first, and whether you can reason about load without having seen it.",
    strong: "Estimate: 10k users is not 10k requests per second - pick a peak rate and state it. Then walk the shared resources in order: connection pool, CPU on any per-request hashing or LLM call, database write contention, the third-party limit you forgot you had. Say what you add first, and what you would add only when the metric forces it.",
    trap: "“Add a load balancer and cache it.” No bottleneck identified means the answer is decoration.",
    source: "Avi Vashishta, “What 2027 Interviews Will Actually Ask You” (question 10)",
    url: "https://www.avivashishta.com/blog/what-2027-interviews-will-actually-ask",
    confidence: "reported",
  },
  {
    id: "proj-4",
    round: "project_defence",
    ask: "What would you change if you rebuilt it?",
    probes: "Whether you can criticise your own work - the closest thing this loop has to a coachability test.",
    strong: "Give one structural regret and one you would repeat on purpose, with the reason. Concrete beats humble: “I would put the job queue behind an interface from day one; the worker is coupled to Postgres and I paid for it in migration” lands. Then say what you would not touch.",
    trap: "“It is pretty solid as it is.” A project with no regrets was not a project, it was a tutorial.",
    source: "Avi Vashishta, “What 2027 Interviews Will Actually Ask You” (question 11)",
    url: "https://www.avivashishta.com/blog/what-2027-interviews-will-actually-ask",
    confidence: "reported",
  },

  // ── Designing around a model ───────────────────────────────────────────────
  {
    id: "design-1",
    round: "ai_system_design",
    ask: "Design a chatbot that answers questions over a company's internal documents.",
    probes: "Whether you can build the retrieval pipeline and then answer the part candidates skip: how do you know the answers are right.",
    strong: "Scope the corpus and the freshness requirement, then chunking and embeddings, the vector store with document-level ACLs, retrieval top-k with reranking, the prompt assembly, and a citation requirement on the output. Then evals: a golden question set, retrieval hit-rate separately from answer quality, human review on a sample, and offline regression before every model or chunking change. Name the cost and latency budget per query.",
    trap: "Designing the embedding store and never mentioning permissions or evaluation. Leaking another team's document is the failure mode this round is built to find.",
    source: "AI Engineer Interview Questions (2026), round-by-round bank; AI system design question set in Alexey Grigorev's AI Engineering Field Guide",
    url: "https://github.com/alexeygrigorev/ai-engineering-field-guide/blob/main/interview/questions/04-ai-system-design.md",
    confidence: "reported",
  },
  {
    id: "design-2",
    round: "ai_system_design",
    ask: "Design one of these: an AI copilot, a document-upload pipeline, a voice assistant, a content-moderation service, a fraud-detection flow.",
    probes: "Same design muscles, different surface - and whether you know where a model belongs and where a plain rule does the job better.",
    strong: "Fix the contract before the components: input, output, latency budget, error semantics. Put the model where judgement is needed and deterministic code everywhere else, then handle retries, idempotency, human escalation for low-confidence cases, and the audit log you need when someone asks why a post was removed.",
    trap: "Model-first design. Every box being an LLM means no latency, cost or failure story - and moderation and fraud are ruled by policy, not vibes.",
    source: "Alexey Grigorev, AI Engineering Field Guide - typical AI system design questions",
    url: "https://github.com/alexeygrigorev/ai-engineering-field-guide/blob/main/interview/questions/04-ai-system-design.md",
    confidence: "reported",
  },

  // ── Applied-AI depth ───────────────────────────────────────────────────────
  {
    id: "app-1",
    round: "applied_ai",
    ask: "When would you use RAG instead of fine-tuning?",
    probes: "Whether you pick the mechanism for the right reason: knowledge that changes, versus behaviour that must change.",
    strong: "RAG when the facts move, when you need citations, or when access control has to survive the answer - retrieval is a query you can permission. Fine-tuning when the format, tone or domain style is the problem, not the knowledge. Then say what you would do for a support bot whose policy PDF updates weekly: retrieval, with a cache invalidation story.",
    trap: "“Fine-tune on our data so it knows everything.” Retraining does not track a changing corpus, does not cite, and quietly forgets.",
    source: "AI Engineer Interview Questions (2026) - LLM and GenAI depth",
    url: "https://aiengineerinsights.com/blog/ai-engineer-interview-questions/",
    confidence: "reported",
  },
  {
    id: "app-2",
    round: "applied_ai",
    ask: "How does your AI agent remember context?",
    probes: "The difference between a window, a store, and something you can trust.",
    strong: "Separate the layers: the raw turn window, a summarised scratchpad for long tasks, and durable state in a database keyed by the conversation or the user. Say what you write, what you evict, and how you keep stale memory from steering a new answer. Mention that tool results, not chat text, should be the source of truth for facts.",
    trap: "“I put the whole history in the prompt.” Costs grow quadratically, the model drowns in old turns, and nothing survives the next session.",
    source: "Avi Vashishta, “What 2027 Interviews Will Actually Ask You” (question 12)",
    url: "https://www.avivashishta.com/blog/what-2027-interviews-will-actually-ask",
    confidence: "reported",
  },
  {
    id: "app-3",
    round: "applied_ai",
    ask: "How would you evaluate whether your AI feature works?",
    probes: "Whether you can define “works” before you ship it. This is the sharpest dividing question in the 2027 loops.",
    strong: "Build a small labelled set from real inputs, score retrieval and generation separately, and use deterministic checks where an answer has a right value plus a rubric or model-assisted judge where it does not - with human review on a sample of the judge's calls. Track a regression gate in CI, then in production watch deflection, edit rate and escalation, not just latency.",
    trap: "Reporting a vibes sample: “I tried ten prompts and they looked good.” No baseline, no split metrics, no gate means no evidence.",
    source: "Avi Vashishta, “What 2027 Interviews Will Actually Ask You” (question 13)",
    url: "https://www.avivashishta.com/blog/what-2027-interviews-will-actually-ask",
    confidence: "reported",
  },
  {
    id: "app-4",
    round: "applied_ai",
    ask: "How would you cut the cost and latency of your LLM calls?",
    probes: "Whether you treat a model call as a budgeted resource.",
    strong: "Order it: stop calling it at all for the requests a cache or a rule can answer; shrink the prompt with retrieval top-k and trimmed history; drop to a smaller model for the easy class and route up only on low confidence; stream so perceived latency beats time-to-first-token; batch offline work. Quote the metric you watch and what you would spend the savings on.",
    trap: "One-lever answers - “use a cheaper model” - that ignore quality, or caching without saying what the cache key is.",
    source: "Avi Vashishta, “What 2027 Interviews Will Actually Ask You” (question 14)",
    url: "https://www.avivashishta.com/blog/what-2027-interviews-will-actually-ask",
    confidence: "reported",
  },
  {
    id: "app-5",
    round: "applied_ai",
    ask: "What is MCP, and when would you use it?",
    probes: "Whether you are keeping up with how tools are wired to models, or just prompting.",
    strong: "Model Context Protocol is an open way to expose tools and context to a model from a separate server, so the same integration is reusable across clients instead of hand-written per app. Reach for it when several assistants need the same set of internal tools, or when you want tool access permissioned outside the prompt. Then name when you would not: one script, one model, no sharing.",
    trap: "Calling it a framework for agents, or reciting the acronym without a use case. Interviewers ask this to see whether you can say no to a dependency.",
    source: "Avi Vashishta, “What 2027 Interviews Will Actually Ask You” (question 15)",
    url: "https://www.avivashishta.com/blog/what-2027-interviews-will-actually-ask",
    confidence: "reported",
  },
  {
    id: "app-6",
    round: "applied_ai",
    ask: "Explain the bias-variance trade-off.",
    probes: "ML fundamentals for roles that call themselves AI engineer.",
    strong: "Bias is the error from oversimplifying; variance is the error from fitting noise. Total error is U-shaped in model complexity, so the craft is choosing complexity and regularisation against your data size. Ground it in something you touched: a tiny training set plus a huge model is high variance, and you fixed it with augmentation or early stopping.",
    trap: "Textbook definition with no example from your own work. If you cannot connect it to a model you trained or evaluated, say so plainly instead of performing it.",
    source: "AI Engineer Interview Questions (2026) - ML fundamentals",
    url: "https://aiengineerinsights.com/blog/ai-engineer-interview-questions/",
    confidence: "reported",
  },
  {
    id: "app-7",
    round: "applied_ai",
    ask: "Implement a retry-with-exponential-backoff wrapper around an LLM API call.",
    probes: "Coding, but on production plumbing: jitter, retry budgets, which errors are retryable.",
    strong: "Retry only on 429, 5xx and timeouts - never on a 400. Exponential delay with jitter so a fleet does not stampede, a cap on attempts and total elapsed time, and respect Retry-After when the API sends one. Write the test that fakes a 429 then a 200 before you polish it.",
    trap: "A bare sleep of 2^n with no jitter and no ceiling, retrying forever. Also: retrying a request that already cost money and produced a partial write.",
    source: "AI Engineer Interview Questions (2026) - coding round",
    url: "https://aiengineerinsights.com/blog/ai-engineer-interview-questions/",
    confidence: "reported",
    patterns: ["Stack", "Graphs"],
  },

  // ── Behavioural, in the AI era ─────────────────────────────────────────────
  {
    id: "beh-1",
    round: "behavioural",
    ask: "How do you use AI tools in your daily work?",
    probes: "Whether AI use is a habit with controls, or a secret you hope nobody asks about.",
    strong: "Give the split honestly: scaffolding, tests, unfamiliar APIs, and long-file reading go through an assistant; anything touching secrets, customer data or a production migration goes through a human, which in a student project means you. Name one time the tool was wrong and how you caught it.",
    trap: "Either extreme - “I never use it”, which now reads as unprepared, or “I prompt everything”, which reads as no ownership.",
    source: "30 Behavioral Interview Questions 2026 - question 25",
    url: "https://interviewcopilot.io/blog/behavioral-interview-questions-2026/",
    confidence: "reported",
  },
  {
    id: "beh-2",
    round: "behavioural",
    ask: "Tell me about a time you dealt with ambiguity.",
    probes: "Whether you stall waiting for a spec, or shrink the unknown yourself.",
    strong: "STAR, then extend it: situation, task, action, result, plus what you would plan differently. Make the action a decision under missing information - you wrote the assumption down, made it explicit to whoever owned it, built the smallest version that could be tested, and got a number back. Quantify the result even roughly.",
    trap: "A story where the ambiguity resolved itself, or a humble-brag. Interviewers are listening for the moment you chose, not the outcome you got.",
    source: "30 Behavioral Interview Questions 2026; STAR-plus-Plan answer framing",
    url: "https://interviewcopilot.io/blog/behavioral-interview-questions-2026/",
    confidence: "reported",
  },
  {
    id: "beh-3",
    round: "behavioural",
    ask: "Prep that survives the round: an example bank, not a script.",
    probes: "Every behavioural loop, including Amazon's leadership principles, draws from the same 5-6 stories.",
    strong: "Write six projects you actually did, each with the numbers you can defend, and tag each against the qualities it shows - ownership, disagree-and-commit, a failure with a real lesson, a deadline you moved. Practise reaching any tag from any story in 90 seconds. Recruiters and AI screening tools are both reading for specificity.",
    trap: "Memorised paragraphs. They collapse the moment the follow-up is not the one you rehearsed - and the follow-up never is.",
    source: "CodexSheet synthesis from the behavioural sources above; practise it in the workspace notes and check your own delivery with Guru",
    url: "https://www.smartrecruiters.com/resources/article/how-to-craft-behavioral-interview-questions-and-get-revealing-answers/",
    confidence: "reported",
  },

  // ── DSA, still the gate ────────────────────────────────────────────────────
  {
    id: "dsa-1",
    round: "dsa_core",
    ask: "Two-sum, then its follow-ups, before the timer moves on.",
    probes: "Hash-map fluency and the ability to change the constraint the interviewer adds: duplicates, k pairs, a sorted array instead of a hash map.",
    strong: "Brute force in one sentence, then the O(n) map, then say the space cost out loud. When the follow-up lands, restate the invariant your solution depends on before you change anything.",
    trap: "Optimising the brute force instead of changing the approach, or reciting the map version without being able to say why it is linear.",
    source: "CodexSheet 250-problem sheet, Arrays & Hashing tier 1",
    url: "https://www.codexsheet.in/problems",
    confidence: "reported",
    patterns: ["Arrays & Hashing"],
  },
  {
    id: "dsa-2",
    round: "dsa_core",
    ask: "The elimination round is still pattern recognition under a clock.",
    probes: "Whether you can map a sentence in the problem statement to one of about sixteen shapes, in under a minute.",
    strong: "Train the trigger words: contiguous subarray and fixed size means sliding window; sorted means two pointers or binary search; next greater or smaller means monotonic stack; k-th or top-k means a heap; count the ways means DP. Say the pattern, say why, then code the skeleton without hunting for syntax.",
    trap: "Solving 400 problems passively. Recognition is what is timed, and it is trained by naming the pattern before touching the keyboard - which is exactly what the pattern films make you say out loud.",
    source: "Job-posting analysis of 50 live SDE listings (mid-size product companies still require foundational DSA; startups mostly do not)",
    url: "https://medium.com/@codegrey/is-dsa-still-required-for-software-engineering-interviews-i-read-50-job-postings-to-find-out-f1f5f2e1cc0c",
    confidence: "reported",
    patterns: ["Arrays & Hashing", "Two Pointers", "Sliding Window", "Binary Search", "Monotonic Stack", "Heaps"],
  },
  {
    id: "dsa-3",
    round: "dsa_core",
    ask: "Now do it while an assistant is open on the screen.",
    probes: "Some AI-aware rounds keep the algorithm question and change what is scored: how you use the tool on a problem that has a known answer.",
    strong: "Solve it yourself first, to a working version, then use the assistant only to check your edge cases or to write the tests. Narrate the division of labour explicitly - that is the signal they are grading.",
    trap: "Handing a known-answer problem to the model and then being unable to defend the complexity. On DSA the assistant is a solver; your job is to be the reviewer.",
    source: "The new “AI-aware” coding interview (how to prepare in 2026)",
    url: "https://medium.com/@codegrey/the-new-ai-aware-coding-interview-how-to-prepare-in-2026-6a207d94b23a",
    confidence: "reported",
    patterns: ["Trees", "Graphs", "1-D DP"],
  },
];

/** What actually changed between the 2024 loop and the 2027 one. */
export const radarShifts: Array<{ headline: string; detail: string; source: string; url: string }> = [
  {
    headline: "Well-specified coding questions stopped being a valid signal",
    detail: "The reason an AI round exists. Canva tested its old questions against assistants, found they were solved trivially, and rebuilt the interview around ambiguity plus tool use instead of banning the tool.",
    source: "Canva Engineering",
    url: "https://www.canva.dev/blog/engineering/yes-you-can-use-ai-in-our-interviews/",
  },
  {
    headline: "Reading code became as graded as writing it",
    detail: "Four of the fifteen questions moving into 2027 loops are about output you did not author: find the bug, explain the prompt, judge correctness, decide what needs review. Generation is cheap now; verification is the job.",
    source: "Avi Vashishta",
    url: "https://www.avivashishta.com/blog/what-2027-interviews-will-actually-ask",
  },
  {
    headline: "Evaluation is the new system-design paragraph",
    detail: "Any AI design question now ends in “how do you know it works”. Candidates with a golden set, split metrics and a CI gate sound senior; candidates with an architecture diagram and no eval sound like a demo.",
    source: "AI Engineering Field Guide + AI Engineer Interview Questions 2026",
    url: "https://github.com/alexeygrigorev/ai-engineering-field-guide/blob/main/interview/questions/04-ai-system-design.md",
  },
  {
    headline: "DSA did not die - it stopped being the only gate",
    detail: "A read of 50 live postings has mid-size product companies still requiring foundational DSA and startups mostly not requiring it. Plan for both: keep the sheet warm, and put the freed hours into a project you can defend.",
    source: "Job-posting analysis of 50 SDE listings",
    url: "https://medium.com/@codegrey/is-dsa-still-required-for-software-engineering-interviews-i-read-50-job-postings-to-find-out-f1f5f2e1cc0c",
  },
];

/**
 * Who allows AI in the interview, as far as public reporting goes.
 * `reported` rows come from third-party trackers and go stale; ask the recruiter
 * who sent the invite. Getting this wrong in the room is a rejection, so the
 * stance shown here is guidance to check, not permission to assume.
 */
export const radarPolicy: Array<{
  company: string;
  stance: "required" | "allowed" | "restricted" | "check_before_you_assume";
  detail: string;
  confidence: "first_party" | "reported";
  source: string;
  url: string;
}> = [
  {
    company: "Canva",
    stance: "required",
    detail: "AI-assisted coding replaced the CS-fundamentals round; candidates are told in advance and expected to use the tool.",
    confidence: "first_party",
    source: "Canva Engineering blog",
    url: "https://www.canva.dev/blog/engineering/yes-you-can-use-ai-in-our-interviews/",
  },
  {
    company: "Shopify",
    stance: "allowed",
    detail: "Reported as allowing AI use in interviews. Confirm against the candidate email you actually received.",
    confidence: "reported",
    source: "Uncharted Career tracker, July 2026",
    url: "https://unchartedcareer.com/blog/companies-that-ban-ai-in-interviews",
  },
  {
    company: "Amazon",
    stance: "check_before_you_assume",
    detail: "Reported as banning candidate AI use in interviews; other trackers describe only voluntary-consent language for AI screening. Read your own invite, then ask.",
    confidence: "reported",
    source: "Uncharted Career + OphyAI employer-rule read, 2026",
    url: "https://ophyai.com/blog/interview-tips/companies-that-allow-ai-in-interviews",
  },
  {
    company: "Anthropic",
    stance: "check_before_you_assume",
    detail: "Reported as disqualifying undisclosed AI use. For a lab that trains on this, assume the interview is a human-verified signal.",
    confidence: "reported",
    source: "Uncharted Career tracker, July 2026",
    url: "https://unchartedcareer.com/blog/companies-that-ban-ai-in-interviews",
  },
  {
    company: "Meta",
    stance: "restricted",
    detail: "Reported as running AI-assisted coding rounds in the 2026 cycle where the tool is provided inside the environment - which usually means you may use theirs and not yours.",
    confidence: "reported",
    source: "Level Up Coding + CodeGrey, 2026",
    url: "https://medium.com/@codegrey/the-new-ai-aware-coding-interview-how-to-prepare-in-2026-6a207d94b23a",
  },
  {
    company: "Most Indian mid-size product companies",
    stance: "restricted",
    detail: "Online assessment platforms still proctor. Until an invite says otherwise, assume any AI use is a policy violation - the shift to open-tool rounds is a big-tech and startup story so far.",
    confidence: "reported",
    source: "Placement-season reporting, 2026-27 batch",
    url: "https://www.linkedin.com/posts/jobsinternshipswale_tech-hiring-offcampus-activity-7389698267569283072-D8Gu",
  },
];

/** Things being said about the 2027 cycle that will cost a student an offer. */
export const radarMyths: Array<{ myth: string; reality: string; url: string; source: string }> = [
  {
    myth: "“DSA is dead, skip it and build agents.”",
    reality: "Half true, and the wrong half to bet on. Startups and some big-tech loops moved on; the proctored online rounds that filter most Indian campus and early-career candidates still run on pattern recognition. Keep tier-1 problems warm and spend the extra hours on a defensible project.",
    url: "https://medium.com/@codegrey/is-dsa-still-required-for-software-engineering-interviews-i-read-50-job-postings-to-find-out-f1f5f2e1cc0c",
    source: "50-posting read + placement-season reporting",
  },
  {
    myth: "“There is a new AI round, so the DSA round is gone.”",
    reality: "Reporting from candidates confuses an added screen with a replaced one. Expect both, and expect the AI round to be the one nobody has prepared for - it is the only round in the loop where practice is genuinely scarce.",
    url: "https://www.avivashishta.com/blog/what-2027-interviews-will-actually-ask",
    source: "Avi Vashishta + 2026 cycle reporting",
  },
  {
    myth: "“I will just use the assistant and say nothing.”",
    reality: "The rounds that permit AI are explicitly grading how you use it, and the ones that ban it are proctoring. Neither pays for silence. Say what you asked, what you rejected, and what you checked.",
    url: "https://www.canva.dev/blog/engineering/yes-you-can-use-ai-in-our-interviews/",
    source: "Canva Engineering blog",
  },
  {
    myth: "“This page is a leak, so I can memorise it.”",
    reality: "It is a map of the round structure, not next week's questions - and the new rounds cannot be memorised anyway. Use it to choose what to practise: the sheet for the gate, your own project for the defence, an eval for the design.",
    url: "https://www.reddit.com/r/PlacementsPrep/comments/1wonhse/finally_placed_2027_batch_no_dsa/",
    source: "CodexSheet - how this page is built",
  },
];

export function radarQuestionsFor(round: RadarRoundId | "all"): RadarQuestion[] {
  return round === "all" ? radarQuestions : radarQuestions.filter((question) => question.round === round);
}

/** Pattern-card names the bank points at, for cross-linking into the library. */
export function radarPatternLinks(): string[] {
  return [...new Set(radarQuestions.flatMap((question) => question.patterns ?? []))].sort();
}
