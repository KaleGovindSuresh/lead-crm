# Frontend Development Plan – Lead Management CRM

This document describes the detailed frontend implementation plan for the CRM system, using the backend APIs you’ve already built.

Stack assumptions:

- React + TypeScript
- Vite for tooling
- React Router for routing
- Axios for HTTP
- Socket.IO client for realtime notifications

Backend API base URL (example): `VITE_API_URL=http://localhost:5000/api`
Socket URL: `VITE_SOCKET_URL=http://localhost:5000`

---

## 1. Project Setup & Structure

### 1.1 Create project & install packages

- Initialize project (example):
  - `npm create vite@latest frontend -- --template react-ts`
- Install core deps:
  - `npm install react-router-dom axios socket.io-client`
  - Optional: `npm install react-hook-form zod @hookform/resolvers`

### 1.2 Folder structure

```text
/frontend
  └─ src
     ├─ api
     │  ├─ axiosClient.ts
     │  ├─ auth.api.ts
     │  ├─ users.api.ts
     │  ├─ leads.api.ts
     │  └─ notifications.api.ts
     ├─ context
     │  └─ AuthContext.tsx
     ├─ hooks
     │  ├─ useAuth.ts
     │  └─ usePermissions.ts
     ├─ components
     │  ├─ Layout
     │  │  └─ AppLayout.tsx
     │  ├─ Auth
     │  │  ├─ LoginForm.tsx
     │  │  └─ RegisterForm.tsx
     │  ├─ Leads
     │  │  ├─ LeadsTable.tsx
     │  │  ├─ LeadFilters.tsx
     │  │  └─ LeadForm.tsx
     │  ├─ Dashboard
     │  │  └─ DashboardCards.tsx
     │  └─ Notifications
     │     ├─ NotificationBell.tsx
     │     └─ NotificationsList.tsx
     ├─ pages
     │  ├─ LoginPage.tsx
     │  ├─ RegisterPage.tsx
     │  ├─ LeadsListPage.tsx
     │  ├─ LeadCreatePage.tsx
     │  ├─ LeadEditPage.tsx
     │  ├─ DashboardPage.tsx
     │  └─ NotificationsPage.tsx
     ├─ routes
     │  └─ AppRouter.tsx
     ├─ sockets
     │  └─ socket.ts
     ├─ utils
     │  └─ formatters.ts
     ├─ App.tsx
     └─ main.tsx
```

### 1.3 Env configuration

Create `.env` and `.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Use `import.meta.env.VITE_API_URL` and `import.meta.env.VITE_SOCKET_URL` in code.

---

## 2. API Layer

### 2.1 Axios client

`src/api/axiosClient.ts`:

- Configure base URL using `VITE_API_URL`.
- Attach JWT token from AuthContext/localStorage in `Authorization: Bearer <token>` header.
- Handle 401 globally: on response error with status 401, clear auth state and redirect to `/login`.

Pseudo-code:

```ts
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.request.use((config) => {
  const token = authStore.getToken(); // from context or helper
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      authStore.logout();
      navigate("/login");
    }
    return Promise.reject(error);
  },
);

export default api;
```

### 2.2 Auth API

`src/api/auth.api.ts`:

- `register(body)` → `POST /auth/register`
- `login(body)` → `POST /auth/login`
- `logout()` → `POST /auth/logout`

Types:

```ts
type LoginBody = { email: string; password: string };
type RegisterBody = { name: string; email: string; password: string };

type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "sales";
};

type LoginResponse = { token: string; user: User };
```

### 2.3 Users API

`src/api/users.api.ts`:

- `getUsers()` → `GET /users`
- `updateUserRole(id, role)` → `PATCH /users/:id/role`

Used mainly for admin/manager features and `assignedTo` dropdown in lead form.

### 2.4 Leads API

`src/api/leads.api.ts`:

- `getLeads(params)` → `GET /leads`
  - Params: `q`, `status`, `source`, `assignedTo`, `createdFrom`, `createdTo`, `sort`, `page`, `limit`.
- `getLead(id)` → `GET /leads/:id`
- `createLead(body)` → `POST /leads`
- `updateLead(id, body)` → `PATCH /leads/:id`
- `deleteLead(id)` → `DELETE /leads/:id`
- `getSummary(params)` → `GET /leads/stats/summary`

### 2.5 Notifications API

`src/api/notifications.api.ts`:

- `getNotifications({ page, limit })` → `GET /notifications`
- `getUnreadCount()` → `GET /notifications/unread-count`
- `markAsRead(id)` → `PATCH /notifications/:id/read`

---

## 3. Auth State & RBAC

### 3.1 AuthContext

`src/context/AuthContext.tsx`:

- Holds:
  - `user: User | null`
  - `token: string | null`
  - `isAuthenticated: boolean`
  - `isBootstrapping: boolean` (while reading from storage)
  - methods: `login`, `logout`, `register`

- On app mount:
  - Read `user` and `token` from `localStorage`.
  - If present, set to context; else, stay logged out.

- `login` implementation:
  - Call `authApi.login`.
  - Store `user` + `token` in state and `localStorage`.

- `logout` implementation:
  - Call `authApi.logout` (optional API call).
  - Clear state and `localStorage`.

### 3.2 useAuth hook

`src/hooks/useAuth.ts`:

- Simple wrapper around `useContext(AuthContext)`.
- Expose `user`, `token`, `isAuthenticated`, `login`, `logout`.

### 3.3 RBAC: usePermissions

`src/hooks/usePermissions.ts`:

- Mirror backend role → permissions mapping:

```ts
type Role = "admin" | "manager" | "sales";
type Permission =
  | "lead:read"
  | "lead:write"
  | "lead:delete"
  | "user:read"
  | "user:write"
  | "dashboard:read"
  | "notification:read";

const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    "lead:read",
    "lead:write",
    "lead:delete",
    "user:read",
    "user:write",
    "dashboard:read",
    "notification:read",
  ],
  manager: ["lead:read", "lead:write", "dashboard:read", "notification:read"],
  sales: ["lead:read", "lead:write", "notification:read"],
};
```

- `usePermissions()` returns:
  - `can(permission: Permission): boolean`
  - `isAdmin()`, `isManager()`, `isSales()`

Use this to:

- Hide/disable Delete Lead if no `lead:delete`.
- Hide Dashboard nav if no `dashboard:read`.
- Hide Admin pages if not admin.

---

## 4. Routing & Layout

### 4.1 Router setup

`src/routes/AppRouter.tsx`:

- Use `BrowserRouter`, `Routes`, `Route`.
- Public routes:
  - `/login` → `LoginPage`
  - `/register` → `RegisterPage`
- Protected routes:
  - Wrap in `RequireAuth` component using `useAuth()`.
  - `/leads`
  - `/leads/new`
  - `/leads/:id/edit`
  - `/dashboard`
  - `/notifications`

`RequireAuth`:

- If `!isAuthenticated`, redirect to `/login`.
- Else, render children.

### 4.2 AppLayout

`src/components/Layout/AppLayout.tsx`:

- Common header with nav links:
  - Leads
  - Dashboard (only if `can('dashboard:read')`)
  - Notifications (notification bell)
  - User menu with Logout.
- Wraps an `<Outlet />` from React Router.
- Place `NotificationBell` in header.

---

## 5. Auth Pages

### 5.1 LoginPage / LoginForm

- Route: `/login`
- Components:
  - `LoginForm` with `email`, `password` fields.
- On submit:
  - Call `authApi.login`.
  - On success:
    - Use `AuthContext.login` to set state.
    - `navigate('/leads')`.
  - On error:
    - Show server error message below the form.

### 5.2 RegisterPage / RegisterForm

- Route: `/register`
- Fields: `name`, `email`, `password`, `confirmPassword`.
- Client-side validation for required fields and matching passwords.
- On submit:
  - Call `authApi.register`.
  - On success:
    - Either auto-login or redirect to `/login` with a success toast.

---

## 6. Leads UI

### 6.1 LeadsListPage

- Route: `/leads`
- Responsibilities:
  - Manage filter and pagination state:
    - `q`, `status`, `source`, `createdFrom`, `createdTo`, `sort`, `page`, `limit`.
  - On state change, call `leadsApi.getLeads(params)`.

Components:

- `LeadFilters`:
  - Search input for `q`.
  - Select dropdowns for `status` and `source`.
  - Date inputs for `createdFrom` / `createdTo`.
  - Sort dropdown (e.g. `name:asc`, `name:desc`, `createdAt:asc`, `createdAt:desc`).
- `LeadsTable`:
  - Columns: Name, Email, Phone, Source, Status, Assigned To (optional), Created At, Actions.
  - Actions per row:
    - View/Edit → link to `/leads/:id/edit`.
    - Delete → if `can('lead:delete')`.

Other behaviors:

- “Add Lead” button visible if `can('lead:write')` → `/leads/new`.
- Loading state while fetching.
- Error message if API fails.
- “No leads found” if `data.length === 0`.
- Pagination controls:
  - Prev/Next buttons.
  - Page numbers.
  - Displays `total`, `totalPages` from API.

### 6.2 LeadCreatePage & LeadForm

- Route: `/leads/new`
- Uses `LeadForm` with empty initial values.
- On submit:
  - Call `leadsApi.createLead(body)`.
  - On success: toast + redirect to `/leads`.
  - On 400: display validation messages.

### 6.3 LeadEditPage

- Route: `/leads/:id/edit`
- On mount:
  - `leadsApi.getLead(id)` to fetch existing lead.
  - Render `LeadForm` with initial values.
- On submit:
  - `leadsApi.updateLead(id, body)`.
  - Handle success + validation errors.

### 6.4 LeadForm details

Fields:

- `name` (text, required)
- `phone` (text, required)
- `email` (email, optional)
- `source` (select: website, referral, cold, other)
- `status` (select: new, contacted, qualified, won, lost)
- `notes` (textarea)
- `assignedTo` (select of users, only visible to manager/admin)

Client-side validation:

- Mirror backend constraints: length, pattern, required fields.
- Display inline errors and global form error summary.

---

## 7. Dashboard

### 7.1 DashboardPage

- Route: `/dashboard`
- Guarded via `can('dashboard:read')`.
- On mount:
  - Call `leadsApi.getSummary({ createdFrom?, createdTo? })`.

Display:

- Total leads card.
- By status card list:
  - new, contacted, qualified, won, lost.
- By source card list:
  - website, referral, cold, other.

Optional:

- Add date range filters to re-fetch summary.
- Add simple bar/pie charts if time permits.

---

## 8. Notifications & Socket.IO

### 8.1 Socket.IO client setup

`src/sockets/socket.ts`:

```ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const connectSocket = (token: string) => {
  socket = io(import.meta.env.VITE_SOCKET_URL, {
    auth: { token },
  });
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
```

Integrate with AuthContext:

- On successful login: `connectSocket(token)`.
- On logout: `disconnectSocket()`.

### 8.2 NotificationBell component

`src/components/Notifications/NotificationBell.tsx`:

- Responsibilities:
  - Show unread count badge.
  - On mount:
    - Call `notificationsApi.getUnreadCount()`.
    - Subscribe to `socket.on('notification', handler)` to increment count when new notifications arrive.
  - On unmount: clean up socket listener.
  - On click: toggle notifications dropdown or navigate to `/notifications`.

### 8.3 NotificationsPage & NotificationsList

`src/pages/NotificationsPage.tsx` + `NotificationsList.tsx`:

- Route: `/notifications`
- State:
  - `page`, `limit`, `notifications`, `total`, `isLoading`, `error`.
- On mount / page change:
  - Call `notificationsApi.getNotifications({ page, limit })`.
- Render list:
  - Each item: message, createdAt, read/unread indicator, optional link to lead.
- Actions:
  - “Mark as read” → `notificationsApi.markAsRead(id)` then update `read` flag and decrement unread count.

---

## 9. Error & Loading UX

- Global error boundary or simple top-level error toast provider.
- Consistent patterns:
  - `isLoading` spinners for:
    - Auth requests.
    - Leads fetching.
    - Dashboard summary fetching.
    - Notifications list.
  - Inline form error messages for validation.
  - Clear empty states when lists are empty (leads, notifications).

---

## 10. Mapping pages to APIs

| Page / Component       | API Endpoints Used                                            |
| ---------------------- | ------------------------------------------------------------- |
| LoginPage              | `POST /api/auth/login`                                        |
| RegisterPage           | `POST /api/auth/register`                                     |
| Global logout action   | `POST /api/auth/logout`                                       |
| LeadsListPage          | `GET /api/leads`, `DELETE /api/leads/:id`                     |
| LeadCreatePage         | `POST /api/leads`                                             |
| LeadEditPage           | `GET /api/leads/:id`, `PATCH /api/leads/:id`                  |
| DashboardPage          | `GET /api/leads/stats/summary`                                |
| NotificationBell       | `GET /api/notifications/unread-count` + Socket.IO             |
| NotificationsPage      | `GET /api/notifications`, `PATCH /api/notifications/:id/read` |
| (Optional) Admin Users | `GET /api/users`, `PATCH /api/users/:id/role`                 |

This plan keeps your API contract as the single source of truth and gives you a clear, incremental path to implement the frontend: start with AuthContext + routing, then Leads pages, then Dashboard, then notifications and polish.
