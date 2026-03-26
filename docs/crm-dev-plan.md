# Lead Management System (CRM+) – Development Plan

## 1. Architecture Overview

- **Stack**: MongoDB, Express.js, React.js, Node.js, Socket.IO.
- **Backend**: RESTful API + Socket.IO server on the same HTTP server, JWT auth + RBAC, MongoDB with Mongoose.
- **Frontend**: React SPA, React Router, Axios (or fetch wrapper), Socket.IO client.
- **Security**: JWT-based auth, bcrypt password hashing, route-level RBAC, basic rate limiting on login, CORS, Helmet.

High-level modules:
- **Auth & Users**: registration, login, logout, JWT issuance/verification, user management, RBAC.
- **Leads**: CRUD, ownership/assignment rules, advanced list API, analytics aggregates.
- **Notifications**: persistence in MongoDB, Socket.IO realtime delivery, REST access + mark-as-read.
- **Frontend UI**: auth flows, leads management, dashboard, notifications, RBAC-aware components.

---

## 2. Backend Design

### 2.1 Project & Folder Structure

```text
/backend
  ├─ src
  │  ├─ config
  │  │  ├─ env.ts          # load env vars, config constants
  │  │  └─ db.ts           # Mongo connection
  │  ├─ models
  │  │  ├─ user.model.ts
  │  │  ├─ lead.model.ts
  │  │  └─ notification.model.ts
  │  ├─ utils
  │  │  ├─ jwt.ts          # sign/verify helpers
  │  │  ├─ error.ts        # AppError, error helpers
  │  │  └─ logger.ts       # basic logger (console/pino)
  │  ├─ rbac
  │  │  ├─ permissions.ts  # roles → permissions map
  │  │  └─ rbac.middleware.ts
  │  ├─ middlewares
  │  │  ├─ auth.middleware.ts   # JWT auth
  │  │  ├─ validate.middleware.ts# request validation
  │  │  └─ rateLimiter.ts       # login rate limiting
  │  ├─ services
  │  │  ├─ auth.service.ts
  │  │  ├─ user.service.ts
  │  │  ├─ lead.service.ts
  │  │  └─ notification.service.ts
  │  ├─ controllers
  │  │  ├─ auth.controller.ts
  │  │  ├─ user.controller.ts
  │  │  ├─ lead.controller.ts
  │  │  └─ notification.controller.ts
  │  ├─ routes
  │  │  ├─ auth.routes.ts
  │  │  ├─ user.routes.ts
  │  │  ├─ lead.routes.ts
  │  │  └─ notification.routes.ts
  │  ├─ sockets
  │  │  └─ index.ts         # Socket.IO setup & events
  │  ├─ app.ts              # express app setup
  │  └─ server.ts           # HTTP + Socket.IO bootstrap
  ├─ scripts
  │  └─ seed.ts             # seed admin/manager/sales + sample leads
  └─ package.json
```

**Key responsibilities per folder:**
- `config`: environment variables, DB setup.
- `models`: Mongoose schemas & models.
- `utils`: shared utilities (JWT, errors, logging).
- `rbac`: central RBAC configuration and middleware.
- `middlewares`: cross-cutting HTTP middlewares.
- `services`: business logic, no HTTP-specific code.
- `controllers`: translate HTTP requests to service calls, handle responses.
- `routes`: define route paths, attach middlewares and controllers.
- `sockets`: Socket.IO configuration, event handlers.
- `scripts`: CLI utilities (seeding).

---

### 2.2 Environment & Configuration

Required backend env vars (`.env.example`):
- `PORT=`
- `MONGO_URI=`
- `JWT_SECRET=`
- `JWT_EXPIRES_IN=1h`
- `NODE_ENV=development`
- `CLIENT_URL=http://localhost:5173`
- `LOGIN_RATE_LIMIT_WINDOW_MS=60000`
- `LOGIN_RATE_LIMIT_MAX=5`

`config/env.ts` exports a typed config object used across app.

---

### 2.3 Data Models (Schemas)

#### User Schema

Fields:
- `name`: string, required, 2–100 chars.
- `email`: string, required, unique, lowercase, email format.
- `passwordHash`: string, required (bcrypt hash).
- `role`: enum: `'admin' | 'manager' | 'sales'`, default `'sales'`.
- `createdAt`, `updatedAt`: Date (timestamps).

Indexes:
- Unique index on `email`.
- Index on `role` for RBAC queries and admin filters.

#### Lead Schema

Fields:
- `name`: string, required, 2–100 chars.
- `phone`: string, required, basic regex validation.
- `email`: string, optional but if provided validate email.
- `source`: enum: `'website' | 'referral' | 'cold' | 'other'`.
- `status`: enum: `'new' | 'contacted' | 'qualified' | 'won' | 'lost'`, default `'new'`.
- `notes`: string, optional.
- `createdBy`: ObjectId (User), required.
- `assignedTo`: ObjectId (User), optional.
- `createdAt`, `updatedAt`: Date.

Indexes (as per assignment):
- Single-field: `createdBy`, `assignedTo`, `status`, `source`, `createdAt`.
- Compound (for list API): e.g. `{ status: 1, source: 1, createdAt: -1 }`.

#### Notification Schema

Fields:
- `user`: ObjectId (User), required.
- `type`: enum: `'lead_created' | 'lead_assigned' | 'lead_reassigned' | 'lead_status_changed' | 'lead_deleted'`.
- `message`: string, required (short text).
- `lead`: ObjectId (Lead), optional (reference for context).
- `read`: boolean, default `false`.
- `createdAt`: Date, default now.

Indexes:
- `{ user: 1, read: 1, createdAt: -1 }` for notification lists.

---

### 2.4 Authentication & Authorization

#### JWT Auth Flow

- Registration (`POST /auth/register`):
  - Validate `name`, `email`, `password`.
  - Hash password with bcrypt.
  - Default role: `sales` unless seeding or admin creates.
  - Return `{ message, user: { id, name, email, role } }`.

- Login (`POST /auth/login`):
  - Validate credentials, compare password with bcrypt.
  - On success, sign JWT with payload: `{ sub: user._id, role: user.role }`.
  - Include `iat`, `exp` via JWT options.
  - Return `{ token, user: { id, name, email, role } }`.

- Optional logout (`POST /auth/logout`):
  - Stateless: client deletes token.
  - API responds `{ message }`.

#### Auth Middleware

- Extract `Authorization: Bearer <token>`.
- Verify JWT with `JWT_SECRET`.
- Attach `req.user = { id, role }`.
- On failure: respond with `401 Unauthorized`.

#### RBAC Configuration

Roles:
- `admin`
- `manager`
- `sales`

Permissions (scopes):
- `user:read`
- `user:write`
- `lead:read`
- `lead:write`
- `lead:delete`
- `dashboard:read`
- `notification:read`

Role → permission mapping (example):

```ts
export const rolePermissions: Record<string, string[]> = {
  admin: [
    'user:read',
    'user:write',
    'lead:read',
    'lead:write',
    'lead:delete',
    'dashboard:read',
    'notification:read',
  ],
  manager: [
    'user:read',           // maybe limited scopes later
    'lead:read',
    'lead:write',          // can assign/reassign
    'dashboard:read',
    'notification:read',
  ],
  sales: [
    'lead:read',          // limited by ownership
    'lead:write',         // limited by ownership
    'notification:read',
  ],
};
```

RBAC middleware (simplified):

```ts
export const requirePermissions = (...required: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user; // set by auth middleware
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const permissions = rolePermissions[user.role] || [];
    const hasAll = required.every((perm) => permissions.includes(perm));

    if (!hasAll) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  };
};
```

This middleware is attached to route definitions, e.g.:

```ts
router.get('/users', authMiddleware, requirePermissions('user:read'), getUsersHandler);
```

Ownership checks for leads are enforced inside the services/controllers for more complex logic (createdBy/assignedTo).

---

### 2.5 Lead Management Logic

#### Validation Rules

- `name`: required, 2–100 chars.
- `phone`: required, basic regex like `/^[0-9+\-()\s]{7,20}$/`.
- `email`: optional; if present, must be valid email.
- `status`: must be one of defined enums.
- `source`: must be one of defined enums.

#### Authorization Rules

- `sales` users:
  - Can access a lead only if `createdBy === userId` or `assignedTo === userId`.
  - Applies to read, update, delete.
- `manager` and `admin`:
  - Can access all leads.
  - Only `admin` allowed to hard delete (if you decide to add extra restrictions).

#### Endpoints

- `POST /leads` (permission: `lead:write`)
  - Body: `{ name, phone, email?, source, status?, notes?, assignedTo? }`.
  - `createdBy` = `req.user.id`.
  - If `assignedTo` is provided:
    - Allow only for `manager`/`admin`.
  - Create lead, trigger `lead_created` notifications.

- `GET /leads/:id` (permission: `lead:read`)
  - Load lead by id.
  - Apply ownership rules.
  - Return `{ lead }`.

- `PATCH /leads/:id` (permission: `lead:write`)
  - Load lead.
  - Apply ownership rules (for sales).
  - Allow updates to: `name`, `phone`, `email`, `source`, `status`, `notes`, `assignedTo`.
  - If `assignedTo` changes: trigger `lead_assigned` or `lead_reassigned` notifications.
  - If `status` changes: trigger `lead_status_changed` notifications.

- `DELETE /leads/:id` (permission: `lead:delete`)
  - Load lead.
  - Apply ownership rules.
  - Delete document.
  - Optionally trigger `lead_deleted` notifications for managers/admins.

---

### 2.6 Advanced Leads List API

Endpoint: `GET /leads`

Query params:
- `q`: search term, case-insensitive, on `name`, `email`, `phone`.
- `status`: exact match.
- `source`: exact match.
- `assignedTo`: filter by assigned user (manager/admin only).
- `createdFrom`: ISO date string.
- `createdTo`: ISO date string.
- `sort`: `field:order` (e.g. `createdAt:desc`, `name:asc`).
- `page`: page number (default 1).
- `limit`: per page (default 10, max 100).

Business rules:
- Multiple filters work together with AND logic.
- Total count must reflect applied filters.
- Sorting must be stable: use `_id` as secondary sort.
- Validate inputs:
  - `page >= 1`.
  - `1 <= limit <= 100`.
  - Valid date formats.
  - Valid sort field and order.

Implementation outline:
- Build base filter:
  - For `sales` users: restrict to `{$or: [{ createdBy: userId }, { assignedTo: userId }]}`.
  - For `manager`/`admin`: start with `{}`.
- Apply search filter:
  - If `q` provided, add `{$or: [{ name: /q/i }, { email: /q/i }, { phone: /q/i }]}`.
- Apply status, source, date range, assignedTo filters.
- Build sort object from `sort` param, with fallback to `{ createdAt: -1, _id: -1 }`.
- Use aggregation with `$facet`:
  - `data`: `$match` → `$sort` → `$skip` → `$limit`.
  - `total`: `$match` → `$count`.
- Map response to:

```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

---

### 2.7 Analytics Endpoint

Endpoint: `GET /leads/stats/summary` (permission: `dashboard:read`).

Query params:
- `createdFrom` (optional)
- `createdTo` (optional)

Implementation:
- Build date filter on `createdAt` if params provided.
- Use MongoDB aggregation with `$match` and `$facet`:
  - `totalLeads` facet: `$count`.
  - `byStatus` facet: `$group` by `status`, `$sum: 1`.
  - `bySource` facet: `$group` by `source`, `$sum: 1`.
- Normalize output:
  - Ensure all status enums (`new`, `contacted`, `qualified`, `won`, `lost`) exist in output, defaulting to 0.
  - Ensure all source enums (`website`, `referral`, `cold`, `other`) exist, defaulting to 0.

Response shape:

```json
{
  "totalLeads": 150,
  "byStatus": {
    "new": 45,
    "contacted": 30,
    "qualified": 25,
    "won": 35,
    "lost": 15
  },
  "bySource": {
    "website": 80,
    "referral": 45,
    "cold": 25,
    "other": 0
  }
}
```

---

### 2.8 Notifications & Socket.IO

#### Socket.IO Server

- Initialize Socket.IO on same HTTP server as Express.
- Configure CORS to allow frontend origin.
- Authenticate sockets:
  - Client sends JWT in `auth` field of handshake or as query param.
  - On connection, verify JWT; if invalid, disconnect.
  - On success, `socket.join('user:' + userId)`.

#### Notification Flow

Create `notification.service.ts` with helper function:

```ts
async function createAndDispatchNotification(input: {
  userIds: string[];
  type: NotificationType;
  message: string;
  leadId?: string;
}) {
  // 1) Persist notifications in MongoDB
  const docs = await NotificationModel.insertMany(
    input.userIds.map((userId) => ({
      user: userId,
      type: input.type,
      message: input.message,
      lead: input.leadId,
    }))
  );

  // 2) Emit via Socket.IO
  docs.forEach((doc) => {
    io.to('user:' + doc.user.toString()).emit('notification', doc);
  });
}
```

Mandatory triggers in lead service/controller:
- Lead created → `lead_created` to all managers/admins and `assignedTo` if present.
- Lead assigned/reassigned → `lead_assigned`/`lead_reassigned` to new `assignedTo`.
- Lead status changed → `lead_status_changed` to assigned user + managers/admins.
- Lead deleted → `lead_deleted` to managers/admins (optional but recommended).

#### Notification REST Endpoints

- `GET /notifications` (permission: `notification:read`)
  - Query params: `page`, `limit`.
  - For `sales` role: restrict to `user = req.user.id`.
  - For `manager`/`admin`: either restrict to own by default, or allow extra filter (e.g. `userId`) with caution.
  - Order by `createdAt` desc.

- `PATCH /notifications/:id/read`
  - Ensure notification belongs to requesting user unless admin is allowed to manage others.
  - Set `read = true`.

---

### 2.9 Error Handling & Logging

- Central error middleware catches thrown `AppError` and unknown errors.
- Respond with:
  - `400` for validation & bad inputs.
  - `401` for auth failures.
  - `403` for forbidden (RBAC / ownership).
  - `404` for not found resources.
  - `500` for unexpected.
- Log errors (at least to console) with request context in development.

---

### 2.10 Seed Data

`scripts/seed.ts`:
- Connect to DB.
- Clear existing collections (optional).
- Create users:
  - Admin: `admin@example.com`, password: `Admin@123`, role: `admin`.
  - Manager: `manager@example.com`, password: `Manager@123`, role: `manager`.
  - Sales 1: `sales1@example.com`, password: `Sales@123`, role: `sales`.
  - Sales 2: `sales2@example.com`, password: `Sales@123`, role: `sales`.
- Create sample leads:
  - A mix of `createdBy` (sales1, sales2, manager) and `assignedTo` values.
  - Various statuses and sources.

Expose npm script:

```json
"scripts": {
  "seed": "ts-node ./src/scripts/seed.ts"
}
```

Document how to run it in README.

---

## 3. Frontend Design

### 3.1 Project & Folder Structure

```text
/frontend
  ├─ src
  │  ├─ api
  │  │  ├─ axiosClient.ts      # axios instance with baseURL + interceptors
  │  │  ├─ auth.api.ts
  │  │  ├─ leads.api.ts
  │  │  └─ notifications.api.ts
  │  ├─ context
  │  │  └─ AuthContext.tsx     # user + token + login/logout helpers
  │  ├─ hooks
  │  │  ├─ useAuth.ts
  │  │  └─ usePermissions.ts   # RBAC checks on frontend
  │  ├─ components
  │  │  ├─ Layout
  │  │  │  └─ AppLayout.tsx
  │  │  ├─ Auth
  │  │  │  ├─ LoginForm.tsx
  │  │  │  └─ RegisterForm.tsx
  │  │  ├─ Leads
  │  │  │  ├─ LeadsTable.tsx
  │  │  │  └─ LeadForm.tsx
  │  │  ├─ Dashboard
  │  │  │  └─ DashboardCards.tsx
  │  │  └─ Notifications
  │  │     ├─ NotificationBell.tsx
  │  │     └─ NotificationsList.tsx
  │  ├─ pages
  │  │  ├─ LoginPage.tsx
  │  │  ├─ RegisterPage.tsx
  │  │  ├─ LeadsListPage.tsx
  │  │  ├─ LeadCreatePage.tsx
  │  │  ├─ LeadEditPage.tsx
  │  │  ├─ DashboardPage.tsx
  │  │  └─ NotificationsPage.tsx (optional separate page)
  │  ├─ routes
  │  │  └─ AppRouter.tsx
  │  ├─ sockets
  │  │  └─ socket.ts           # Socket.IO client init
  │  ├─ utils
  │  │  └─ formatters.ts
  │  ├─ main.tsx
  │  └─ App.tsx
  └─ package.json
```

### 3.2 Env & API Client

Frontend `.env.example`:
- `VITE_API_URL=http://localhost:4000/api`
- `VITE_SOCKET_URL=http://localhost:4000`

`axiosClient.ts`:
- Set `baseURL` from `VITE_API_URL`.
- Request interceptor attaches `Authorization: Bearer <token>` from localStorage.
- Response interceptor:
  - If 401, clear auth state and redirect to login.

### 3.3 Auth Flow

- `AuthContext` stores `user` and `token`.
- `LoginForm`/`RegisterForm` call `auth.api.ts`:
  - On success, save token + user in context and localStorage.
  - Navigate to `/leads`.
- Protected routes:
  - `AppRouter` wraps private pages in `RequireAuth` component.
  - If not authenticated, redirect to `/login`.

### 3.4 RBAC on Frontend

- `usePermissions` reads `user.role` and exposes helpers:
  - `can(permission: string)`, `isAdmin()`, `isManager()`, `isSales()`.
- Use in UI:
  - Hide or disable delete button if `!can('lead:delete')`.
  - Hide `assignedTo` selector in form for sales users.
  - Hide dashboard link if `!can('dashboard:read')`.

### 3.5 Leads List Page

- State: `q`, `status`, `source`, `createdFrom`, `createdTo`, `sort`, `page`, `limit`.
- Use `leads.api.ts` to fetch list with query params.
- Show:
  - Table with leads and actions (view/edit/delete) based on permissions.
  - Total count and pagination controls (prev/next + page numbers).
  - Empty state message.
  - Loading & error states.

### 3.6 Lead Form (Create/Edit)

- `LeadForm` component receives `initialValues` and `mode` (`create` or `edit`).
- Validation on client side mirrors server rules.
- On submit:
  - For create: `POST /leads`.
  - For edit: `PATCH /leads/:id`.
- On success: show toast/snackbar and redirect to list.

### 3.7 Dashboard Page

- Call `/leads/stats/summary` via `leads.api.ts`.
- Display cards:
  - Total leads.
  - Leads by status (list or small chart).
  - Leads by source.
- Show loading, error, and empty states.

### 3.8 Notifications UI

- Initialize Socket.IO client (`socket.ts`) only when user is authenticated:
  - `io(VITE_SOCKET_URL, { auth: { token } })`.
- In `NotificationBell`:
  - Subscribe to `notification` events.
  - Maintain unread count in state or context.
  - On click, show dropdown list of recent notifications.
- `NotificationsList`:
  - Fetch paginated `GET /notifications`.
  - Support `Mark as read` that calls `PATCH /notifications/:id/read`.
  - Update unread count accordingly.

---

## 4. System Design Table

### 4.1 Modules & Responsibilities

| Module            | Responsibilities                                                                 | Tech / Layer                                       |
|-------------------|----------------------------------------------------------------------------------|----------------------------------------------------|
| Auth & Users      | Register, login, logout, password hashing, JWT issuance, user listing & roles   | Express controllers, auth & RBAC middleware, JWT   |
| RBAC              | Define roles & permissions, enforce scopes per-route, forbid unauthorized access| `rolePermissions` map, `requirePermissions` middleware |
| Leads             | CRUD, ownership & assignment, validations, advanced list, analytics source      | Mongoose model, lead service, list aggregation     |
| Analytics         | Compute stats by status/source, total leads with optional date filters          | MongoDB aggregation with `$match`, `$group`, `$facet` |
| Notifications     | Persist notifications, send via Socket.IO, mark as read, list with pagination   | Notification model/service, Socket.IO server       |
| Socket.IO         | Authenticate sockets, manage user rooms, emit events on lead changes            | Socket.IO server & client                          |
| API Layer         | Expose REST endpoints, validate inputs, map to services & responses             | Express routes/controllers, validation middleware  |
| Frontend Auth     | Login/register forms, token storage, protected routes                          | React, AuthContext, Axios interceptors             |
| Frontend Leads    | List, filters, pagination, lead form create/edit, permission-based actions      | React components, hooks, API layer                 |
| Frontend Dashboard| Display stats by status/source, total leads                                    | React components, charts (optional)                |
| Frontend Notifs   | Notification bell, unread count, real-time updates, mark-as-read UI            | React components, Socket.IO client, REST API       |

### 4.2 Collections & Key Indexes

| Collection      | Key Fields                                           | Indexes                                                                 |
|-----------------|------------------------------------------------------|-------------------------------------------------------------------------|
| `users`         | `name`, `email`, `passwordHash`, `role`             | `email` unique, `role`                                                 |
| `leads`         | `name`, `phone`, `email`, `source`, `status`, `createdBy`, `assignedTo`, `createdAt` | `createdBy`, `assignedTo`, `status`, `source`, `createdAt`, compound `{ status: 1, source: 1, createdAt: -1 }` |
| `notifications` | `user`, `type`, `message`, `lead`, `read`, `createdAt` | `{ user: 1, read: 1, createdAt: -1 }`                                  |

---

## 5. Endpoint Summary

### 5.1 Auth & Users

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout` (optional)
- `GET /users` (admin only)
- `PATCH /users/:id/role` (admin only)

### 5.2 Leads

- `POST /leads` (create)
- `GET /leads` (list with filters, search, sort, pagination)
- `GET /leads/:id` (detail)
- `PATCH /leads/:id` (update)
- `DELETE /leads/:id` (delete)
- `GET /leads/stats/summary` (analytics)

### 5.3 Notifications

- `GET /notifications` (paginated list)
- `PATCH /notifications/:id/read` (mark as read)

---

## 6. Implementation Checklist (Development Plan)

### Backend

1. Initialize backend project, setup Express app, connect to Mongo, add base middlewares.
2. Implement User, Lead, Notification Mongoose models with enums and indexes.
3. Implement auth service & controller (register, login, logout) with bcrypt + JWT.
4. Implement JWT auth middleware and attach to protected routes.
5. Define RBAC `rolePermissions` map and `requirePermissions` middleware.
6. Implement `/users` endpoints with admin-only access.
7. Implement lead service & controller: CRUD, validations, ownership & assignment rules.
8. Implement advanced `GET /leads` list using aggregation + `$facet` for data + total.
9. Implement `GET /leads/stats/summary` analytics aggregation.
10. Setup Socket.IO server, JWT-based socket auth, and user rooms.
11. Implement notification service: create + dispatch, plus REST list & mark-as-read.
12. Wire notification triggers into lead create/update/delete flows.
13. Add centralized error handling, logging, and consistent error responses.
14. Add seed script for admin/manager/sales users and sample leads.

### Frontend

1. Initialize React app, configure routing and base layout.
2. Implement Axios client with baseURL and auth interceptors.
3. Implement AuthContext, login/register pages, and protected routes.
4. Implement RBAC helpers (`usePermissions`) and gate UI actions.
5. Implement leads list page with filters, search, sorting, pagination, and total count.
6. Implement lead create/edit pages with shared form component and validation.
7. Implement dashboard page using `/leads/stats/summary`.
8. Setup Socket.IO client, listen to `notification` events, maintain unread count.
9. Implement notification bell + dropdown and notifications list page (or panel).
10. Add loading, empty, and error states across all major pages.

### Documentation & Delivery

1. Write README with setup instructions, env variables, running dev servers, and build commands.
2. Document RBAC design (roles, permissions, example matrix).
3. Export Postman collection with sample requests for all endpoints.
4. Describe MongoDB indexes and why they were chosen.
5. Optionally deploy backend (Render/Railway) and frontend (Vercel) and add links.
