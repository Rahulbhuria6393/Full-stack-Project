# EvalEngine — Automated Code Judge & Lab Assignment Grader

EvalEngine is a full-stack MERN automated coding assignment grader supporting **JavaScript (Node.js)** and **Python 3** execution with sandboxed temporary workspaces, strict 3-second TLE safeguards, role-based access control (`student` and `instructor`), and real-time test-case verdict diffs.

## Directory Structure

- `server/` — Node.js + Express (ES Modules), Mongoose models (`User`, `Problem`, `Submission`), JWT + RBAC middleware, and `server/utils/judge.js` execution engine.
- `client/` — React + Vite SPA, Tailwind CSS, Monaco Editor, Lucide icons, and React Router protected routes.

## Quick Start

### 1. Backend Setup
```bash
cd server
cp .env.example .env
npm install
npm run seed
npm run dev
```
> **Note:** If a local MongoDB instance is not running on `MONGODB_URI`, the server automatically falls back to a persistent embedded `mongodb-memory-server` instance (`USE_MEMORY_DB_FALLBACK=true`).

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173`.

## Demo Credentials (from `npm run seed`)
- **Student:** `student@evalengine.dev` / `Student123!`
- **Instructor:** `instructor@evalengine.dev` / `Instructor123!`

## Seeded Algorithmic Problems
1. **Two Sum** (`Easy`)
2. **Palindrome String** (`Easy`)
3. **Array Reverse** (`Easy`)
