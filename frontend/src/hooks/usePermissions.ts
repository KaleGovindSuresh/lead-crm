import { useAuth } from "./useAuth";
import type { Role, Permission } from "../types";

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
  manager: [
    "lead:read",
    "lead:write",
    "user:read",
    "dashboard:read",
    "notification:read",
  ],
  sales: ["lead:read", "lead:write", "notification:read"],
};

export const usePermissions = () => {
  const { user } = useAuth();

  const can = (permission: Permission): boolean => {
    if (!user) return false;
    return rolePermissions[user.role]?.includes(permission) ?? false;
  };

  const isAdmin = () => user?.role === "admin";
  const isManager = () => user?.role === "manager";
  const isSales = () => user?.role === "sales";

  return { can, isAdmin, isManager, isSales };
};
