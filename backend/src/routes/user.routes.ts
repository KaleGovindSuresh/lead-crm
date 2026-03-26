import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requirePermissions } from "../rbac/rbac.middleware";
import { validate, updateRoleSchema } from "../middlewares/validate.middleware";

const router = Router();

// All user routes require auth
router.use(authMiddleware);

// GET /api/users  — admin only
router.get(
  "/",
  requirePermissions("user:read", "user:write"),
  userController.getAllUsers,
);

// PATCH /api/users/:id/role  — admin only
router.patch(
  "/:id/role",
  requirePermissions("user:write"),
  validate(updateRoleSchema),
  userController.updateRole,
);

export default router;
