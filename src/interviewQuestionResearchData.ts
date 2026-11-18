export type InterviewCompanyId = "google" | "amazon" | "microsoft" | "atlassian";
export type InterviewQuestionCategory = "Coding" | "System design" | "Debugging" | "Behavioral";

export type InterviewCompanyGuide = {
  id: InterviewCompanyId;
  name: string;
  url: string;
  source: string;
};

export type InterviewPracticeQuestion = {
  id: string;
  company: InterviewCompanyId;
  category: InterviewQuestionCategory;
  prompt: string;
  followUp: string;
  evaluation: string;
};

export const interviewCompanyGuides: InterviewCompanyGuide[] = [
  { id: "google", name: "Google", source: "Our hiring process", url: "https://www.google.com/about/careers/applications/how-we-hire/" },
  { id: "amazon", name: "Amazon", source: "How We Hire", url: "https://www.amazon.jobs/content/en/how-we-hire" },
  { id: "microsoft", name: "Microsoft", source: "Hiring tips", url: "https://careers.microsoft.com/v2/global/en/hiring-tips" },
  { id: "atlassian", name: "Atlassian", source: "Interviewing at Atlassian", url: "https://www.atlassian.com/company/careers/resources/interviewing" },
];

export const interviewPracticeQuestions: InterviewPracticeQuestion[] = [
  {
    id: "google-meeting-rooms",
    company: "google",
    category: "Coding",
    prompt: "Given meeting start and end times, return the minimum number of rooms needed so no meetings overlap in the same room.",
    followUp: "Explain how your answer changes if a meeting ending at 10:00 can share a room with one starting at 10:00.",
    evaluation: "Clarify interval boundaries, compare a sorting or heap approach, and state time and space complexity.",
  },
  {
    id: "google-debug-large-input",
    company: "google",
    category: "Debugging",
    prompt: "A function passes its examples but times out on large inputs. Explain how you would find the cause and improve it.",
    followUp: "What evidence would distinguish an algorithmic bottleneck from slow I/O or an unexpectedly large input?",
    evaluation: "Start with a reproducible case and measurements; identify the dominant cost before changing the implementation.",
  },
  {
    id: "google-disagreement",
    company: "google",
    category: "Behavioral",
    prompt: "Describe a technical decision you disagreed with. How did you make the disagreement productive, and what happened?",
    followUp: "What evidence would change your mind if you faced the same decision again?",
    evaluation: "Give a specific example, explain the trade-off, and show how you worked with others rather than just who won.",
  },
  {
    id: "amazon-lru-cache",
    company: "amazon",
    category: "Coding",
    prompt: "Implement an LRU cache with constant-time get and put operations.",
    followUp: "How should the cache behave when its capacity is zero, or when put updates an existing key?",
    evaluation: "Choose a hash map plus a recency-ordered structure, explain invariants, and test eviction boundaries.",
  },
  {
    id: "amazon-order-retries",
    company: "amazon",
    category: "System design",
    prompt: "Design an order-submission service that remains safe when clients retry after a timeout.",
    followUp: "How would you prevent a retry from charging the customer twice while still recovering from a failed dependency?",
    evaluation: "Cover idempotency, durable state transitions, failure handling, observability, and customer-visible outcomes.",
  },
  {
    id: "amazon-customer-incident",
    company: "amazon",
    category: "Behavioral",
    prompt: "Tell me about a time you found a problem affecting users and took responsibility for getting it resolved.",
    followUp: "How did you decide what to fix first, and how did you know the fix helped?",
    evaluation: "Describe your own actions, the user impact, the trade-offs, and a measurable result without overstating your role.",
  },
  {
    id: "microsoft-stream-median",
    company: "microsoft",
    category: "Coding",
    prompt: "Numbers arrive one at a time. After each number, report the median of all values seen so far.",
    followUp: "How would you handle duplicate values and define the median when the count is even?",
    evaluation: "State the invariant for the data structure, walk through a small example, and analyze each insertion.",
  },
  {
    id: "microsoft-review-patch",
    company: "microsoft",
    category: "Debugging",
    prompt: "Review a small code change that adds caching to an API. What correctness and operational risks would you check?",
    followUp: "How would you test invalidation and ensure one user's data cannot be returned to another?",
    evaluation: "Look beyond the happy path: stale data, cache keys, permissions, concurrency, metrics, and rollback.",
  },
  {
    id: "microsoft-project-tradeoff",
    company: "microsoft",
    category: "Behavioral",
    prompt: "Describe a project where you had to balance a technical improvement against a delivery deadline.",
    followUp: "What did you defer, how did you communicate the risk, and what would you do differently now?",
    evaluation: "Explain the context, your decision, how you collaborated, and the outcome with a concrete lesson.",
  },
  {
    id: "atlassian-board-edits",
    company: "atlassian",
    category: "System design",
    prompt: "Design a team task board that supports simultaneous edits and remains usable during a brief network outage.",
    followUp: "How should the interface and backend resolve two people editing the same field?",
    evaluation: "Discuss the user workflow, conflict semantics, offline changes, synchronization, and accessible feedback.",
  },
  {
    id: "atlassian-group-mentions",
    company: "atlassian",
    category: "Coding",
    prompt: "Given a stream of comments and mentions, produce the unread mention count for each user.",
    followUp: "How would your approach change if events can arrive more than once or out of order?",
    evaluation: "Define the input contract, handle duplicate events, and explain how state is updated efficiently.",
  },
  {
    id: "atlassian-team-clarity",
    company: "atlassian",
    category: "Behavioral",
    prompt: "Tell me about a time you improved how a team shared decisions or kept work visible.",
    followUp: "How did you include people who were not in the original discussion, and what changed afterward?",
    evaluation: "Use a real example and explain the impact on the team's work, not just the tool or process you introduced.",
  },
];
