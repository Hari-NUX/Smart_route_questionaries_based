# SmartRoute

SmartRoute is a placement helper for candidates and placement hosts. This repository contains a React frontend and an Express, MongoDB backend in one workspace.

## Requirements

- Node.js 20.19+ or 22.12+
- pnpm 10+ or npm 10+
- MongoDB Community Server, or a MongoDB Atlas connection string
- Docker Desktop if using the included local MongoDB container

## Install

Clone the repository, open a terminal in its root, and install dependencies with either package manager:

```powershell
pnpm install
```

Or:

```powershell
npm install
```

## Configure environment

Create the backend environment file:

```powershell
Copy-Item backend/.env.example backend/.env
```

Set `MONGODB_URI`, a random `JWT_SECRET` with at least 32 characters, a private `ADMIN_SIGNUP_CODE`, and `GEMINI_API_KEY` in `backend/.env`. The admin signup code is required for host accounts. Candidate accounts can sign up without it. Keep the Gemini key in the backend environment only; never place it in frontend environment variables or commit it.

For local MongoDB with Docker Desktop, start Docker Desktop and run:

```powershell
docker compose up -d mongodb
```

Create the frontend environment file if you need a different API URL:

```powershell
Copy-Item frontend/.env.example frontend/.env
```

The default frontend API URL is `http://localhost:5000/api`.

## Run locally

From the repository root, you can start each app in its own terminal:

```powershell
pnpm back
```

Or with npm:

```powershell
npm run dev --workspace=backend
```

Start the frontend in the other:

```powershell
pnpm front
```

Or with npm:

```powershell
npm run dev --workspace=frontend
```

Or start both apps in one terminal with pnpm:

```powershell
pnpm both
```

The frontend runs at `http://localhost:5173`; the API runs at `http://localhost:5000`. Check `http://localhost:5000/api/health` for API availability.

## Authentication API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/signup` | Create a candidate account or invite-protected host account |
| POST | `/api/auth/login` | Sign in and receive a JWT |
| GET | `/api/auth/me` | Return the signed-in account; requires a bearer token |
| POST | `/api/placements` | Generate a question bank and publish a placement; host role and bearer token required |
| GET | `/api/placements/mine` | List placements created by the signed-in host |
| GET | `/api/placements` | Search published placements; supports `search` and `sort=deadline` |
| POST | `/api/placements/:placementId/register` | Register a candidate while the window is open and capacity remains |
| GET | `/api/applications/mine` | List the signed-in candidate's applications |
| POST | `/api/applications/:applicationId/start` | Start or resume an adaptive quiz |
| POST | `/api/applications/:applicationId/answer` | Score an answer and receive the next question immediately |

New accounts use the `users` collection and have either the `candidate` or `admin` role. Passwords are hashed before storage. The frontend stores the issued JWT in local storage for this prototype. Placements are stored separately and linked to the host who created them.

Hosts can configure the registration window, registration capacity, supported CSE domains, quiz length from 1 to 50, starting difficulty, and difficulty randomness. Placement creation asks Gemini for three questions per quiz slot, balanced across easy, medium, and hard, then stores the bank with the placement. The quiz session starts at the selected difficulty. A correct answer raises the next target difficulty in that domain; a wrong answer lowers it. The randomness setting can skip an additional difficulty level.

Gemini is called while the host publishes, not after candidate answers. Candidate answer requests only read the stored bank, score the answer on the server, update the application, and return the next pre-generated question. This keeps answer-to-next-question latency independent of Gemini response time. The answer key stays in the placement's private question bank and is not returned to placement or application list endpoints.

Set `GEMINI_MODEL` to change the model; the default is `gemini-3.8-flash`. Gemini access, free-tier eligibility, and request limits depend on the Google AI project and selected model. Each placement creation makes one generation request.

## Project layout

```text
backend/src/config         Runtime configuration
backend/src/controllers    HTTP request handlers
backend/src/middleware     Authentication and role checks
backend/src/models         Mongoose models
backend/src/routes         API route definitions
backend/src/services       Authentication and business logic
frontend/src/components    Reusable React components
frontend/src/services      API client functions
```

The next planned features are candidate placement discovery and registration, adaptive quiz sessions, and the host applicant dashboard.
