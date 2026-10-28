# SmartRoute

SmartRoute is a placement helper for candidates and placement hosts. This repository contains a React frontend and an Express, MongoDB backend in one workspace.

Requirements

Install these tools before setting up the project:

- Git
- Node.js 20.19+ or 22.12+
- pnpm 10.33.0 (the version pinned by this repository)
- Docker Desktop with Docker Compose v2 for the included local MongoDB, or a separate MongoDB server / MongoDB Atlas database

Check that Node and Docker are available:

```powershell
node --version
npm --version
docker --version
docker compose version
```

Install the repository's pnpm version once if pnpm is not already available:

```powershell
npm install --global pnpm@10.33.0
```

## Clone and run on Windows

Run these steps in PowerShell. Replace `<repository-url>` with the GitHub URL for this repository.

### 1. Clone the repository

```powershell
git clone <repository-url>
Set-Location SmartRoute
```

### 2. Install all workspace dependencies

Run one install command from the repository root:

```powershell
pnpm install
```

The root `pnpm-workspace.yaml` includes both `backend` and `frontend`. This command reads the root and workspace `package.json` files and installs dependencies for all three packages, including the `concurrently` runner used by `pnpm both`. Do not run install commands separately inside each folder.

### 3. Create and configure the backend environment

```powershell
Copy-Item backend/.env.example backend/.env
```

Open `backend/.env` and set:

- `JWT_SECRET` to a private random string of at least 32 characters
- `ADMIN_SIGNUP_CODE` to a private invite code for host account creation
- `GEMINI_API_KEY` to your Gemini API key
- `MONGODB_URI` if you use a database other than the included local MongoDB

Keep `backend/.env` private and out of Git. The candidate flow can be used without Gemini, but hosts need a valid Gemini key to generate a placement question bank.

The frontend `.env` file is optional when using the default local API address. Copy `frontend/.env.example` to `frontend/.env` only if the API is hosted at a different URL.

### 4. Start MongoDB with Docker

Start Docker Desktop, then run this from the repository root:

```powershell
docker compose up -d
docker compose ps
```

The included `docker-compose.yml` starts MongoDB on `localhost:27017`; the example backend URI already points to it. The first start downloads the MongoDB image. This Compose file only defines the database, so `docker compose up -d --build` is unnecessary: there are no app services or Dockerfiles to build.

If you use MongoDB Atlas or an existing MongoDB server instead, set its connection string as `MONGODB_URI` and skip the Docker step.

### 5. Start the frontend and backend

From the repository root, run:

```powershell
pnpm both
```

This starts the Express API and the Vite development server together. Open `http://localhost:5173` for the app. The API runs at `http://localhost:5000`; `http://localhost:5000/api/health` reports whether it is responding.

Press `Ctrl+C` in that terminal to stop both app processes. MongoDB continues running in Docker. Stop MongoDB with `docker compose stop`; start it again with `docker compose up -d`.

### Optional: run with npm

`npm install` at the repository root also installs the workspace dependencies. Start each service in a separate terminal:

```powershell
npm run dev --workspace=backend
```

```powershell
npm run dev --workspace=frontend
```

The single-command `pnpm both` shortcut requires pnpm.

### Useful Docker commands

```powershell
docker compose ps
docker compose logs -f mongodb
docker compose stop mongodb
docker compose down
```

The named database volume survives `docker compose down`. `docker compose down -v` removes the volume and permanently deletes the local MongoDB data.

## Authentication API

| Method | Endpoint                                                | Purpose                                                                                        |
| ------ | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| POST   | `/api/auth/signup`                                      | Create a candidate account or invite-protected host account                                    |
| POST   | `/api/auth/login`                                       | Sign in and receive a JWT                                                                      |
| GET    | `/api/auth/me`                                          | Return the signed-in account; requires a bearer token                                          |
| POST   | `/api/placements`                                       | Generate a question bank and publish a placement; host role and bearer token required          |
| GET    | `/api/placements/mine`                                  | List placements created by the signed-in host                                                  |
| GET    | `/api/placements/:placementId/applicants?order=highest` | List the host's registered candidates and scores; use `order=lowest` to reverse score ordering |
| GET    | `/api/placements`                                       | Search published placements; supports `search` and `sort=deadline`                             |
| POST   | `/api/placements/:placementId/register`                 | Register a candidate while the window is open and capacity remains                             |
| GET    | `/api/applications/mine`                                | List the signed-in candidate's applications                                                    |
| POST   | `/api/applications/:applicationId/start`                | Start or resume an adaptive quiz                                                               |
| POST   | `/api/applications/:applicationId/answer`               | Score an answer and receive the next question immediately                                      |

New accounts use the `users` collection and have either the `candidate` or `admin` role. Passwords are hashed before storage. The frontend stores each issued JWT in that browser tab's session storage, so separate tabs can use separate accounts and each tab keeps its login through refreshes. The selected light/dark theme is stored in local storage and shared across tabs. Placements are stored separately and linked to the host who created them.

Hosts can configure the registration window, registration capacity, supported CSE domains, quiz length from 1 to 50, starting difficulty, and difficulty randomness. Placement creation asks Gemini for three questions per quiz slot, balanced across easy, medium, and hard, then stores the bank with the placement. The quiz session starts at the selected difficulty. A correct answer raises the next target difficulty in that domain; a wrong answer lowers it. The randomness setting can skip an additional difficulty level.

Gemini is called while the host publishes, not after candidate answers. Candidate answer requests only read the stored bank, score the answer on the server, update the application, and return the next pre-generated question. This keeps answer-to-next-question latency independent of Gemini response time. The answer key stays in the placement's private question bank and is not returned to placement or application list endpoints.

Set `GEMINI_MODEL` to change the primary model; the default is `gemini-3.8-flash`. Gemini access, free-tier eligibility, and request limits depend on the Google AI project and selected model. If the primary model is temporarily unavailable, the backend tries the alternate Flash model once.

## Responsiveness and scale

The interface uses responsive layouts that collapse to one column on narrow screens and expand on tablets and desktops. Domain selection uses a searchable, height-limited list with a theme-matched scrollbar. The backend limits public placement results to 100 and enforces registration capacity with an atomic database update. Question banks are generated at publication and reused for quiz responses.

This is a classroom prototype, not a load-tested production deployment. It does not yet include pagination, multiple API instances, centralized session management, or load testing. Docker improves local environment consistency and data persistence here; it does not automatically make the app faster.

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

The current app includes candidate placement discovery and registration, adaptive quiz sessions, and the host applicant and score dashboard.
