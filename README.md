# Codexsheet Academy

Build a production-ready full-stack DSA learning platform called Codexsheet.

SUPABASE

Use my existing Supabase project.

Project ID:
eqdibpkirvsgvfihqlta

Supabase URL:
https://eqdibpkirvsgvfihqlta.supabase.co

Configure Supabase through environment variables:

VITE_SUPABASE_URL=https://eqdibpkirvsgvfihqlta.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<SUPABASE_PUBLISHABLE_KEY>


Never hard-code the key into application source code.

Do NOT create another Supabase project.

Before creating tables, inspect the existing database and reuse compatible tables if they already exist.

1. AUTHENTICATION

Use Supabase Auth.

Implement:

Email signup

Email login

Logout

Forgot password

Reset password

Persistent sessions

Protected routes

User profile

Create/use:

profiles

Fields:

id

user_id

name

email

avatar_url

role

created_at

updated_at

Roles:

user

admin

Use Supabase Row Level Security.

2. MAIN PLATFORM

Create these pages:

/

/login

/signup

/dashboard

/dsa-sheet

/patterns

/problem/:slug

/playground

/bookmarks

/notes

/progress

/premium

/profile

/admin

Navigation:

Codexsheet

DSA Sheet

Patterns

CodeX Playground

Progress

Bookmarks

Premium

3. HOME PAGE

Hero section:

Master DSA by Patterns 🚀

Subtitle:

Stop memorizing problems. Learn patterns, build logic, and solve DSA problems with confidence.

CTA:

Start DSA Sheet

Secondary CTA:

Explore Patterns

Show platform statistics:

250+ Patterns

DSA Problems

CodeX Playground

Progress Tracking

4. DSA SHEET

Build a complete pattern-based DSA Sheet.

Topics:

Arrays

Strings

Hashing

Two Pointers

Sliding Window

Binary Search

Linked List

Stack

Queue

Recursion

Backtracking

Trees

BST

Heap

Greedy

Graphs

Dynamic Programming

Bit Manipulation

Trie

Advanced Algorithms

Each problem contains:

title

slug

description

difficulty

topic

pattern

examples

constraints

hints

brute-force approach

optimized approach

explanation

time complexity

space complexity

starter code

solution code

external URL

is_premium

created_at

updated_at

5. 250+ PATTERNS

Create a dedicated pattern library.

Every pattern should have:

Name

Description

How to identify it

When to use it

Common template

Complexity

Example problems

Related patterns

Common mistakes

Core philosophy:

Understand → Identify Pattern → Brute Force → Optimize → Code → Test → Revise

Examples:

Two Sum → Hashing

Longest Substring Without Repeating Characters → Sliding Window

Maximum Subarray → Kadane's Algorithm

Search in Rotated Sorted Array → Binary Search

Number of Islands → BFS/DFS

Climbing Stairs → Dynamic Programming

6. DATABASE

Create these Supabase tables if they don't already exist.

topics

id

name

slug

description

created_at

patterns

id

topic_id

name

slug

description

identification

template

complexity

created_at

problems

id

topic_id

pattern_id

title

slug

description

difficulty

examples

constraints

hints

brute_force

optimized_approach

explanation

time_complexity

space_complexity

starter_code

solution_code

external_url

is_premium

created_at

updated_at

user_progress

id

user_id

problem_id

status

attempts

last_attempted_at

solved_at

Statuses:

not_started

attempted

solved

bookmarks

id

user_id

problem_id

created_at

user_notes

id

user_id

problem_id

note

created_at

updated_at

revision_history

id

user_id

problem_id

revised_at

user_code

id

user_id

problem_id

language

code

created_at

updated_at

7. CODEX PLAYGROUND

Create a powerful coding playground.

Features:

Code editor

Language selector

Run

Test cases

Custom input

Output console

Error console

Reset

Save code

Problem-specific starter code

Languages:

C++

JavaScript

Python

Java

Problem page button:

Solve in CodeX Playground

When clicked:

Load problem

Load starter code

Load test cases

Load selected language

Save user code to user_code.

If an external code execution API is required, use a secure Supabase Edge Function/backend.

Never expose execution API secrets in frontend code.

8. PROBLEM PAGE

Create a clean interview-style problem page.

Sections:

Problem

Statement, examples and constraints.

Pattern

Clearly explain:

What pattern is this problem using?

Brute Force

Explain the straightforward solution.

Optimized Approach

Explain how and why it improves.

Complexity

Display:

Time: O(...)

Space: O(...)

Code

Show the solution.

Practice

Buttons:

Solve in Playground

Mark Solved

Bookmark

Add Note

Revise

9. DASHBOARD

After login:

Welcome back 👋

Show:

Problems Solved

Problems Attempted

Total Problems

Completion %

Current Streak

Patterns Completed

Add:

Continue Learning

Show recently attempted problems.

Topic Progress

Display progress for each DSA topic.

Pattern Progress

Display mastered/in-progress patterns.

Recent Activity

Show recent solved and revised problems.

10. SEARCH & FILTERS

DSA Sheet must support:

Search:

Problem name

Pattern

Topic

Filters:

Easy

Medium

Hard

Solved

Unsolved

Attempted

Bookmarked

Free

Premium

Add sorting by:

Difficulty

Progress

Recently added

11. PREMIUM

Create Free and Premium access.

Premium users receive:

Complete DSA Sheet

250+ patterns

Premium problems

Advanced explanations

Full playground features

Progress analytics

Revision system

Premium resources

Create an attractive Premium upgrade page.

12. UPI PAYMENT

Create a UPI payment flow.

Use a configurable UPI ID through environment/configuration.

Do NOT hard-code private payment information in React source code.

Flow:

User selects Premium.

Show plan and price.

Show UPI payment instructions.

Display UPI QR.

User completes payment.

User enters transaction/reference ID.

Create pending payment.

Admin reviews it.

Admin approves/rejects.

Approved users receive Premium access.

Create:

payments

id

user_id

amount

transaction_id

payment_method

status

created_at

verified_at

verified_by

Statuses:

pending

approved

rejected

Create:

subscriptions

id

user_id

plan

status

started_at

expires_at

Plans:

free

premium

Never store bank/card credentials.

13. ADMIN DASHBOARD

Admin-only dashboard.

Features:

Manage users

Add topics

Add patterns

Add problems

Edit problems

Delete problems

Add test cases

Set free/premium

View payments

Approve payments

Reject payments

Manage subscriptions

View analytics

Protect all admin routes with Supabase Auth + role checks.

14. RLS SECURITY

Enable Row Level Security.

Users can only access their own:

profile

progress

bookmarks

notes

saved code

Only admins can:

Create/update/delete problems

Create/update/delete patterns

Manage topics

Verify payments

Modify subscriptions

Public users may read only content marked as publicly accessible.

Never expose:

service-role key

database password

payment secrets

code execution API secrets

15. UI DESIGN

Create a premium developer-focused interface.

Style:

Modern

Clean

Fast

Professional

Dark mode

Responsive

Mobile friendly

Use:

shadcn/ui

cards

badges

tabs

progress bars

searchable tables

clean code blocks

skeleton loading

toast notifications

empty states

Difficulty:

Easy

Medium

Hard

Progress indicators:

Solved

Attempted

Unsolved

Bookmarked

Premium

16. SEED DATA

Add starter DSA problems:

Two Sum

Best Time to Buy and Sell Stock

Maximum Subarray

Contains Duplicate

Longest Substring Without Repeating Characters

Binary Search

Search in Rotated Sorted Array

Reverse Linked List

Merge Two Sorted Lists

Valid Parentheses

Min Stack

Binary Tree Traversal

Level Order Traversal

Lowest Common Ancestor

Number of Islands

Clone Graph

Climbing Stairs

House Robber

Coin Change

Longest Increasing Subsequence

Connect each problem to its appropriate topic and pattern.

17. LEARNING EXPERIENCE

Make every problem follow this flow:

Understand Problem

↓

Identify Pattern

↓

Think Brute Force

↓

Optimize

↓

Write Code

↓

Run Test Cases

↓

Mark Solved

↓

Revise

The platform should teach problem-solving instead of encouraging users to simply copy solutions.

18. PERFORMANCE

Implement:

Lazy loading

Pagination where appropriate

Database indexes

Efficient Supabase queries

Debounced search

Loading states

Error states

Optimistic UI for progress/bookmarks where safe

19. FINAL REQUIREMENT

Build the complete application, not just mock screens.

Implement:

✅ Supabase integration
✅ Authentication
✅ Database schema
✅ RLS policies
✅ DSA Sheet
✅ 250+ pattern architecture
✅ Problem pages
✅ CodeX Playground
✅ Progress tracking
✅ Bookmarks
✅ Notes
✅ Revision system
✅ Premium system
✅ UPI payment workflow
✅ Admin dashboard
✅ Responsive UI
✅ Dark mode

Use this existing Supabase project:

eqdibpkirvsgvfihqlta

Do not create another project.

First inspect the existing database/schema. Reuse compatible resources and avoid duplicate tables.

Make the codebase scalable so hundreds of patterns and thousands of DSA problems can be added later without redesigning the architecture

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://codexsheet.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2b0ee418-c372-423f-b0a3-2ebc5a362796).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
