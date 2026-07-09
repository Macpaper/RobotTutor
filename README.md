# Robot Tutor 🤖

A web app that teaches beginners how to code, with an AI tutor built in. Students work through interactive coding exercises directly in the browser, get instant feedback on their code, and can request AI-generated hints that respond to what they've *actually written*, not just the exercise topic.

Built for a real coding class of students aged 10–18, currently deployed and in active use.

**Live site:** [robotcodingtutor.com](https://robotcodingtutor.com)

---

## What it does

- Students log in, pick an exercise set (e.g. "Functions Refresher"), and solve problems one at a time in an in-browser code editor.
- Code is graded **server-side** by actually running it in a sandboxed environment and checking the result — not by pattern-matching text, so students can't fake a pass through devtools.
- Stuck? A one-click **AI hint** button sends the student's current code and the exercise description to Google's Gemini API, which returns hint without giving away the answer.
- A **"Run"** button lets students test their code and see console output before submitting, separate from the graded "Check" button.
- Progress is tracked with light animations (a pulse per exercise, confetti on completing a full set) to make the feedback loop feel rewarding rather than clinical.

## Tech stack

| Layer | Tech |
|---|---|
| Backend | Node.js, Express, EJS |
| Frontend | React (mounted as an "island" via Vite — not a full SPA rewrite) |
| Code editor | Monaco Editor (`@monaco-editor/react`) |
| Code execution | Node's built-in `vm` module, sandboxed per submission |
| Database | SQLite (`better-sqlite3`), with Postgres migration planned as usage grows |
| Auth | `express-session` + `bcrypt` password hashing |
| AI | Google Gemini API (`@google/genai`) |
| Hosting | DigitalOcean droplet, Nginx reverse proxy, PM2 process management, Cloudflare DNS + HTTPS |

## A few notable engineering decisions

**React as an island** Most of the app is server-rendered EJS which is sufficient for static or form-based pages. React is used on pages like the exercise runner to rerender new exercises without reloading the page.

**Content and grading logic are decoupled from student data.** Exercises live in a static JSON file, versioned alongside the code. Grading logic lives in separate checker functions, one per exercise. Student accounts and submission history live in the database. This separation means exercises can be added or edited without touching the database, and grading logic can be tightened (see below) without touching exercise content.

**Grading is intentionally adversarial-tested.** Early checker functions were pattern-matching-based (e.g. "does the console output contain the word 'Hello'?") and were found — through actual testing — to be gameable (e.g. hardcoding the expected output outside the required function). Checkers were rewritten to actually invoke student-defined functions inside the sandbox with fixed test cases and verify real return values and function arity, rather than trusting superficial signals like keyword matching.

**Deployed and debugged end-to-end.** Beyond writing the app, this included setting up a Linux server from scratch: configuring Nginx as a reverse proxy, process management with PM2, DNS and HTTPS through Cloudflare and Certbot, and diagnosing real production issues (crash loops from missing environment variables, case-sensitive filesystem bugs that only appeared outside of Windows/macOS development, and database schema drift between environments).

## Setup

```bash
git clone https://github.com/Macpaper/RobotTutor.git
cd RobotTutor
npm install

# Build the React island
cd client && npm install && npm run build && cd ..

# Set up the database
node db/setup.js

# Add environment variables
cp .env.example .env   # then fill in GEMINI_API_KEY and SESSION_SECRET

npm start
```

## Roadmap

- [ ] Migrate from SQLite to Postgres as the student base grows
- [ ] Teacher-facing dashboard for assigning homework and reviewing submissions
- [ ] Concept-explainer panel and prerequisite links for students who need a refresher on a specific topic before attempting an exercise
- [ ] AST-based grading for exercises where pattern-matching remains gameable

---

*Built solo, from initial architecture through production deployment.*
