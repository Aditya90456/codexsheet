# 🚀 CodexSheet

> **A pattern-based DSA roadmap to help you prepare smarter for coding interviews.**

[CodexSheet](https://codexsheet.vercel.app/) is a curated **Data Structures & Algorithms (DSA) sheet** designed for students and developers preparing for coding interviews, placements, and top tech companies.

Instead of solving hundreds of random problems, CodexSheet focuses on **patterns, concepts, and progressive problem-solving**.

## 🌟 Why CodexSheet?

Preparing for DSA can feel overwhelming.

There are thousands of problems across platforms, but the real challenge is knowing:

* What should I solve first?
* Which problems are actually important?
* What pattern does this problem use?
* How do I recognize the same pattern in a new problem?
* When should I move to the next topic?

**CodexSheet is built to solve that problem.**

### 🎯 Learn Patterns → Solve Problems → Crack Interviews

---

## 🧠 What You'll Find

CodexSheet organizes DSA preparation around important interview patterns and topics.

### 📚 Core Topics

* Arrays
* Strings
* Hashing
* Two Pointers
* Sliding Window
* Binary Search
* Linked Lists
* Stack & Queue
* Recursion
* Backtracking
* Trees
* Binary Search Trees
* Heaps
* Graphs
* Dynamic Programming
* Greedy Algorithms
* Tries
* Bit Manipulation

And more topics will be added continuously.

---

## ⚡ Pattern-Based Learning

The goal isn't to memorize solutions.

It's to learn how to **identify patterns**.

For example:

```text
Problem
   ↓
Understand Constraints
   ↓
Identify Pattern
   ↓
Choose Data Structure
   ↓
Build Approach
   ↓
Code
   ↓
Analyze Complexity
```

Once you understand the underlying pattern, solving new problems becomes much easier.

---

## 🎓 Who Is CodexSheet For?

CodexSheet is useful for:

* 👨‍💻 College students
* 🎓 Placement preparation
* 💼 Software engineering interviews
* 🚀 Developers switching jobs
* 🧑‍💻 Competitive programmers
* 📖 Anyone starting DSA

Whether you're starting from scratch or revising before an interview, CodexSheet can be used as a structured roadmap.

---

## 🛠️ Features

### 🔒 Local Personal AI

Open `/assistant` for a general-purpose assistant powered by Ollama. It does not use a hosted AI API or require an API key. Chat history and reminders are stored in the current browser; reminders are a saved list and do not trigger notifications.

1. Install [Ollama for Windows](https://ollama.com/download/windows) and start it.
2. In a terminal, run `ollama run gemma3:1b` to download and start a small local model (about 806 MB). The first run needs an internet connection. This model is a practical starting point for this PC's 3.9 GB of RAM; expect slower replies on its Celeron CPU.
3. For local development, in another terminal run `npm run dev` from this project folder. The Vite proxy connects the page to Ollama.
4. To use the deployed site, allow its exact origin in Ollama. On Windows, quit Ollama from the taskbar, run `[Environment]::SetEnvironmentVariable("OLLAMA_ORIGINS", "https://www.codexsheet.in", "User")` in PowerShell (use the exact origin shown in the assistant's Settings), then reopen Ollama. If the browser asks to allow local network access, allow it.
5. Open the site and choose **Personal AI** in the navigation, or go to `/assistant`.

Use **Settings** on the assistant page to choose another model already installed in Ollama. Ollama requires cross-origin browser access to be explicitly allowed with `OLLAMA_ORIGINS`; allow only the CodexSheet origin you use, not `*`.

### Gemini problem help

The problem library's **Ask Gemini** action uses a Vercel serverless function and Google Gemini. Add `GOOGLE_AI_API_KEY` to the Vercel project environment variables (server-side only; do not use a `VITE_` prefix), then redeploy. Requests require a valid Clerk sign-in and use only the selected problem details and the student's status. Gemini interactions are sent with `store: false`.

### 📋 Curated DSA Sheet

A structured collection of important coding problems.

### 🧩 Pattern-Based Preparation

Problems are organized around common DSA patterns.

### 📈 Progressive Difficulty

Build your skills gradually instead of jumping directly into hard problems.

### 👥 Community

Learn, discuss, and share your preparation journey with other developers.

### 📝 Notes

Keep your own notes while solving problems and revising concepts.

---

## 🚀 Getting Started

Visit:

**https://codexsheet.vercel.app/**

Start with the fundamentals and work your way through the patterns.

Don't try to finish everything in one day.

Consistency > Speed.

---

## 💡 Recommended Strategy

A simple preparation strategy:

```text
1. Learn the concept
        ↓
2. Understand the pattern
        ↓
3. Solve an easy problem
        ↓
4. Solve medium problems
        ↓
5. Attempt without looking at the solution
        ↓
6. Review your mistakes
        ↓
7. Revise the pattern
```

### 🔥 Remember

> Don't memorize the solution.
> Understand why the solution works.

---

## 🗺️ Roadmap

CodexSheet is actively evolving.

Planned improvements include:

* [ ] More DSA patterns
* [ ] More curated problems
* [ ] Progress tracking
* [ ] User profiles
* [ ] Streaks & achievements
* [ ] Personalized DSA roadmap
* [ ] AI-powered hints
* [ ] AI interview practice
* [ ] More community features
* [ ] Detailed interview preparation tracks

---

## 🤝 Contributing

Found a problem, typo, or improvement?

Contributions are welcome.

You can contribute by:

1. Forking the repository
2. Creating a new branch
3. Making your changes
4. Creating a Pull Request

Every contribution can help make DSA preparation easier for someone else.

---

## ⭐ Support CodexSheet

If CodexSheet helps you with your DSA preparation:

⭐ Star the project
📢 Share it with your friends
💬 Give feedback
🤝 Contribute to the project

Every bit of support helps.

---

## 👨‍💻 Built For Developers

CodexSheet is built with one simple idea:

> **You don't need to solve everything. You need to solve the right problems and understand the patterns.**

Start your DSA journey today.

### 🚀 [Start with CodexSheet](https://codexsheet.vercel.app/)

---

## 📄 License

This project is currently under development.

See the repository license for details.
