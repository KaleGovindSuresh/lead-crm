## CRM+ Backend

### Overview

- RESTful Express API backed by MongoDB and TypeScript, handling auth, users, leads, and real-time notifications.
- JWT + role-based guards protect every `*/api/*` route while Socket.IO runs on the same HTTP server for live notification delivery.
- Global error handling, rate-limited login, and Helmet/CORS harden the API before business logic even runs.

### Tech stack

- TypeScript + Node.js
- Express 5, Socket.IO 4, Mongoose
- Security: bcryptjs, jsonwebtoken, cors, helmet, express-rate-limit
- Utilities: tsx for short dev cycles, dotenv for env config, morgan + custom logger

### Getting started

1. Ensure you have Node.js (18+) and npm installed, plus a MongoDB instance (local `mongodb://localhost:27017/crm_plus` by default).
2. `cd backend && npm install`
3. Copy environment variables (see table) into `.env` at the repo root.
4. Seed the database if you need users/leads for testing: `npm run setup:app`.
5. Start the dev server: `npm run dev` (uses `tsx watch src/server.ts`). For production builds, run `npm run build` then `npm start`.

### Environment variables

Set the values that fit your deployment. Defaults are used when the `.env` key is missing unless the field is marked required.

| Name                         | Purpose                       | Default / Notes                         |
| ---------------------------- | ----------------------------- | --------------------------------------- |
| `PORT`                       | HTTP & Socket.IO port         | `4000`                                  |
| `MONGO_URI`                  | MongoDB connection string     | `mongodb://localhost:27017/crm_plus`    |
| `JWT_SECRET`                 | Secret for signing tokens     | **required** (change before production) |
| `JWT_EXPIRES_IN`             | Token lifetime                | `1h`                                    |
| `NODE_ENV`                   | App environment               | `development`                           |
| `CLIENT_URL`                 | Frontend URL allowed via CORS | `http://localhost:5173`                 |
| `LOGIN_RATE_LIMIT_WINDOW_MS` | Rate-limit window (ms)        | `60000`                                 |
| `LOGIN_RATE_LIMIT_MAX`       | Max login attempts per window | `5`                                     |

### Scripts you need

- `npm run dev` – runs `tsx watch src/server.ts` with auto-reload.
- `npm run build` – emits compiled JS into `dist`.
- `npm start` – starts `node dist/server.js` for production.
- `npm run setup:app` – seeds admin/manager/sales users plus sample leads (see `backend/scripts/seed.ts`).

### API surface & integration

- All REST endpoints are namespaced under `/api/*`. Refer to `docs/api-endpoints.md` for the schema, middleware guards, and permissions per route.
- Controllers, services, and routes are grouped under `src/` so the HTTP layer only orchestrates business logic from `src/services` and `src/sockets`.
- Socket.IO is initialized after the HTTP server boots (`src/server.ts`), so frontends can connect to `${config.clientUrl}` using their JWT token (see `src/sockets`).
- Cross-origin requests are restricted to `CLIENT_URL`, so keep the frontend env `VITE_API_URL` in sync (e.g., `http://localhost:4000/api`).

### Reference documentation

- `docs/crm-dev-plan.md` – architecture, RBAC, data-model, and background notes that guided the backend layout.
- `docs/api-endpoints.md` – endpoint catalog and required permissions for each route.

### Troubleshooting hints

- If Mongo fails to connect, confirm `MONGO_URI` and that the database accepts connections from your host/port.
- Rate-limited logins respond with 429; adjust `LOGIN_RATE_LIMIT_*` or wait a minute before retrying.
- Check `npm run setup:app` output for seeded credentials if you need admin/manager/sales accounts to log in.
