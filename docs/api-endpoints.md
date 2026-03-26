---

## 🏥 Health Check
| Method | Endpoint  | Description        |
|--------|----------|--------------------|
| GET    | /health  | Check server status |

---

# 🔐 Auth Routes (`/api/auth`)

| Method | Endpoint  | Middleware                              | Description               |
| ------ | --------- | --------------------------------------- | ------------------------- |
| POST   | /register | validate(registerSchema)                | Register new user         |
| POST   | /login    | loginRateLimiter, validate(loginSchema) | Login user (rate limited) |
| POST   | /logout   | authMiddleware                          | Logout user               |

---

# 👤 User Routes (`/api/users`)

> 🔒 All routes require authentication

| Method | Endpoint  | Middleware                                                                 | Description           |
| ------ | --------- | -------------------------------------------------------------------------- | --------------------- |
| GET    | /         | authMiddleware, requirePermissions(user:read, user:write)                  | Get all users (admin) |
| PATCH  | /:id/role | authMiddleware, requirePermissions(user:write), validate(updateRoleSchema) | Update user role      |

---

# 📊 Lead Routes (`/api/leads`)

> 🔒 All routes require authentication

| Method | Endpoint       | Middleware                                                                 | Description         |
| ------ | -------------- | -------------------------------------------------------------------------- | ------------------- |
| GET    | /stats/summary | authMiddleware, requirePermissions(dashboard:read)                         | Get dashboard stats |
| GET    | /              | authMiddleware, requirePermissions(lead:read)                              | Get all leads       |
| POST   | /              | authMiddleware, requirePermissions(lead:write), validate(createLeadSchema) | Create lead         |
| GET    | /:id           | authMiddleware, requirePermissions(lead:read)                              | Get lead by ID      |
| PATCH  | /:id           | authMiddleware, requirePermissions(lead:write), validate(updateLeadSchema) | Update lead         |
| DELETE | /:id           | authMiddleware, requirePermissions(lead:delete)                            | Delete lead         |

---

# 🔔 Notification Routes (`/api/notifications`)

> 🔒 All routes require authentication

| Method | Endpoint      | Middleware                                            | Description               |
| ------ | ------------- | ----------------------------------------------------- | ------------------------- |
| GET    | /             | authMiddleware, requirePermissions(notification:read) | Get notifications         |
| GET    | /unread-count | authMiddleware, requirePermissions(notification:read) | Get unread count          |
| PATCH  | /:id/read     | authMiddleware, requirePermissions(notification:read) | Mark notification as read |

---
