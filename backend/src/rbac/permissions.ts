export type Permission =
  | "user:read"
  | "user:write"
  | "lead:read"
  | "lead:write"
  | "lead:delete"
  | "dashboard:read"
  | "notification:read";

export const rolePermissions: Record<string, Permission[]> = {
  admin: [
    "user:read",
    "user:write",
    "lead:read",
    "lead:write",
    "lead:delete",
    "dashboard:read",
    "notification:read",
  ],
  manager: [
    "user:read",
    "lead:read",
    "lead:write",
    "dashboard:read",
    "notification:read",
  ],
  sales: ["lead:read", "lead:write", "notification:read"],
};

export function hasPermission(role: string, permission: Permission): boolean {
  const perms = rolePermissions[role] ?? [];
  return perms.includes(permission);
}

export function hasAllPermissions(
  role: string,
  permissions: Permission[],
): boolean {
  return permissions.every((p) => hasPermission(role, p));
}
