# TeamOS AI — Team Workspace & Task Management

A runnable MVP built with React + Vite, Node.js + Express, MongoDB Atlas, JWT, and Socket.IO.

## Features
- Register/login with JWT
- Create and view projects
- Create, assign, prioritize, and update tasks
- Dashboard summary
- Workspace-ready data model (users, projects, tasks)
- Real-time task update event foundation with Socket.IO
- AI assistant endpoint with a rule-based fallback (add an AI provider later)

## Requirements
- Node.js 18+
- MongoDB Atlas M0 connection string (or local MongoDB)

## 1. Backend setup
```bash
cd backend
copy .env.example .env
npm install
```
Edit `.env` and set `MONGO_URI` and `JWT_SECRET`.
```bash
npm run dev
```
Backend runs at `http://localhost:5000`.

## 2. Frontend setup
Open another terminal:
```bash
cd frontend
npm install
npm run dev
```
Open the Vite URL (usually `http://localhost:5173`).

## 3. MongoDB Atlas
1. Create an Atlas M0 free cluster.
2. Create a database user and password.
3. In Network Access, allow your current IP address.
4. Copy the Node.js connection string into `backend/.env`.
5. Replace `<password>` with your database user's password and set the database name to `teamos`.

## Notes
- Never commit `.env` or expose your MongoDB URI/JWT secret in frontend code.
- This is an MVP foundation, not a production-audited system. Before production, add email verification, password reset, rate limiting, audit logs, stronger validation, tests, and robust workspace membership authorization.
- The AI endpoint currently uses a safe rule-based demo response so the project runs without a paid AI key.
