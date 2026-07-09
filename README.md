# Power Grid Game

Browser puzzle game: rotate power line tiles until all cells are connected to the central power plant.

## Monorepo layout

- `packages/client/` — browser game (HTML, CSS, ES modules)
- `packages/shared/` — shared game logic (score, tiles, power flow)
- `packages/server/` — Node.js API, replay verification, static file server

## Local development

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)

### Setup

```bash
npm install
cp .env.example .env
npm run db:up
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The server serves the game, shared modules (`/shared/`), and API routes (`/api/*`).

### Day-to-day (after initial setup)

```bash
npm run db:up   # only if PostgreSQL is not running
npm run dev
```

### Database migrations

Migration SQL files live in `packages/server/migrations/`. They run automatically on server start (`npm run dev` or `npm start`).

### Environment

| Variable | Description |
| -------- | ----------- |
| `DATABASE_URL` | PostgreSQL connection string (Docker Compose uses port **55432** to avoid clashing with a local PostgreSQL on 5432) |
| `PORT` | HTTP port (default `3000`) |

## Game

Choose board **width** and **height** from odd sizes between 5 and 13. Optional wrap mode connects opposite edges (torus).

### Controls

| Action | Desktop | Mobile |
| ------ | ------- | ------ |
| Rotate left | Click left half of tile | — |
| Rotate right | Click right half of tile | Tap tile |
| Lock/unlock | Right-click or Space/L | Long-press |
| Pause | P or HUD button | HUD button |

### Leaderboard

- All completed games are stored server-side with full replay data.
- Only verified runs without pause appear on the leaderboard (top 100).
- Names are optional; unnamed entries show as *Anonymous*.
- If you qualify for the top 100, you may enter a name (1–16 alphanumeric characters).

## Railway deployment

1. Create a Railway project with a **Node.js** service and **PostgreSQL** addon.
2. Link PostgreSQL — Railway sets `DATABASE_URL` automatically.
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Deploy — the server runs migrations on startup and listens on `PORT`.

## Development notes

The original version of this game was implemented by hand in 2016. The current source code is a full rewrite and extension of that prototype, built with **agentic coding** — an AI coding assistant in [Cursor](https://cursor.com) helped design, implement, and refine the codebase from the initial concept.

## License

[MIT](LICENSE) — Copyright (c) 2016-2026 martinjhuber
