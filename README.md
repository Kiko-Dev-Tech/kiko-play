# KikoPlay

Minigames for playing with friends over Discord. The first game is **Kikopardy**, a Jeopardy clone:
the host picks questions, players buzz in and answer out loud, and the host judges the answers in the app.

## Run with Docker

```bash
cp .env.example .env   # set ADMIN_PASSWORD
docker compose up --build
```

Open http://localhost:8080 (or the `APP_PORT` you set). Postgres data is stored in the `db-data` volume.
The database schema is created by migrations on backend start.

## Local development

You need Node 24 and a Postgres database.

```bash
# Backend (http://localhost:3000)
cd backend
cp .env.example .env   # adjust DATABASE_URL and ADMIN_PASSWORD
npm install
npm run start:dev

# Frontend (http://localhost:4200, proxies /api and /socket.io to the backend)
cd frontend
npm install
npm start
```

Checks:

| Where      | Command                       |
|------------|-------------------------------|
| `backend`  | `npm test`, `npm run lint`    |
| `backend`  | `npm run check:contract` (backend and frontend contract copies are identical) |
| `frontend` | `npm test`, `npm run build`   |

## How a game works

1. Everyone picks a username on first visit. It is stored in the browser, so reloads keep the player and score.
2. The host logs in with the admin password in the Kikopardy lobby, creates a board and starts a game.
3. Players join with the 5-character code or the invite link.
4. The host picks a question, then opens the buzzers. The first buzz wins (players can also press space).
5. **Correct** adds the points and reveals the answer. **Wrong** subtracts the points and reopens the
   buzzers for everyone who hasn't tried yet. **Unlock players** lets those who answered wrong buzz again.
6. The host can change any score at any time and end the game. Finished games appear in the history.

Running games are saved after every scoring change, so after a server restart the host can resume them from the lobby.

## Project structure

```
backend/src/
  auth/        admin password login, JWT, AdminGuard
  boards/      board entity and CRUD (admin only)
  kikopardy/   game rules (game-room.ts), persistence (games.service.ts),
               WebSocket gateway, history REST API, shared contract
  database/    TypeORM config and migrations

frontend/src/app/
  core/        app-wide services (player, admin auth), guards, interceptor
  shared/ui/   generic ui-* components
  features/
    player/       page-username
    game-select/  page-game-select
    kikopardy/    pages/ (page-*), ui/ (ui-*), services/, kikopardy.contract.ts
```

Conventions: routed pages use `page-*` selectors, reusable components use `ui-*`. `ui-*` components only take
inputs and emit outputs. State, logic and server calls live in services.

`kikopardy.contract.ts` (types and socket event names) exists in both backend and frontend and must stay identical.
Edit the backend copy and copy it over.
