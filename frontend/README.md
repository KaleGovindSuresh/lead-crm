# CRM+ Frontend

### Overview

- React 19 + Vite SPA that talks to the backend via `src/api` abstractions and shows leads, dashboard stats, notifications, and RBAC-aware navigation.
- Auth flows persist JWTs/identity in localStorage and reroute unauthenticated users to `/login`; the same token powers Socket.IO notifications through `src/sockets/socket.ts`.
- Layout + page routing live in `src/routes/AppRouter.tsx`, using `usePermissions` to hide or guard admin-only routes.

### Tech stack

- React 19 + TypeScript
- Vite 8 + Tailwind CSS 4 + ESLint
- Axios (`src/api/axiosClient.ts`) with interceptors and Socket.IO client for realtime notifications

### Getting started

1. `cd frontend && npm install`
2. Create `.env.local` (or `.env`) with at least:
   - `VITE_API_URL=http://localhost:4000/api` (or your backend URL)
   - `VITE_SOCKET_URL=http://localhost:4000`
3. Run `npm run dev` (Vite dev server) and keep it running while you work.
4. For production-ready builds: `npm run build` followed by `npm run preview` to verify the generated assets.
5. Run `npm run lint` to check for ESLint issues before shipping.

> Note: Backend must allow CORS from the frontend URL (see `backend/.env` `CLIENT_URL`) so set `CLIENT_URL=http://localhost:5173` when running both sides locally.

### Key directories

- `src/api/*` – Axios wrapper + modules for auth, users, leads, and notifications (`authApi`, `leadsApi`, `usersApi`, `notificationsApi`).
- `src/context` – `AuthContext` bootstraps stored tokens, exposes `login/logout/register`, and wires Socket.IO; `ToastContext` renders transient toasts.
- `src/routes/AppRouter.tsx` – defines public (login/register) and protected (leads, dashboard, notifications, users) routes plus permission/role guards.
- `src/components` – grouped UI pieces (`Layout/AppLayout`, `Leads`, `Dashboard`, `Notifications`, `Auth` forms, and shared `UI` primitives).
- `src/sockets/socket.ts` – manages a singleton Socket.IO client authenticated via the stored JWT.

### Auth & permissions

- `AuthContext` stores user/token pairs in localStorage, automatically reconnects Socket.IO for authenticated sessions, and exposes `isBootstrapping` so routes can wait for hydration.
- `usePermissions` maps roles to scopes (`lead:read`, `lead:write`, `dashboard:read`, `notification:read`, etc.), so navigation links and routes render only when the backend would authorize them.
- API swap is safe: Axios interceptors clear storage and redirect to `/login` on `401` responses.

### Common scripts

- `npm run dev` – launches the Vite dev server on `http://localhost:5173` by default.
- `npm run build` – compiles the app into `dist`.
- `npm run preview` – serves the built assets locally for smoke tests.
- `npm run lint` – runs ESLint rules defined at the project root.

### References

- `docs/crm-frontend-plan.md` – detailed frontend architecture, api plan, hooks, and component ideas.
- `backend/README.md` – for backend setup and env requirements so the two halves stay in sync.
