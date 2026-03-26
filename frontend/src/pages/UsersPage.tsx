import { useState, useEffect } from "react";
import { usersApi } from "../api/users.api";
import { RoleBadge } from "../components/UI/Badges";
import { PageLoader } from "../components/UI/Spinner";
import { ErrorState, EmptyState } from "../components/UI/States";
import { useToast } from "../context/ToastContext";
import { getInitials } from "../utils/formatters";
import type { User, Role } from "../types";

export const UsersPage = () => {
  const showToast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = () => {
    setIsLoading(true);
    usersApi
      .getUsers()
      .then((result) => setUsers(result.users))
      .catch(() => setError("Failed to load users"))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: Role) => {
    setUpdatingId(userId);
    try {
      await usersApi.updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
      showToast("Role updated successfully", "success");
    } catch {
      showToast("Failed to update role", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={fetchUsers} />;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Users</h1>
        <p className="mt-1 text-sm text-slate-500">
          {users.length} team member{users.length !== 1 ? "s" : ""}
        </p>
      </div>

      {users.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        <div className="card overflow-hidden">
          {/* Desktop */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e2d4d]">
                  {["User", "Email", "Role", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-medium text-slate-500 tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-[#1a2440] hover:bg-[#1a2440]/50 transition-colors last:border-0"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-xs font-bold text-blue-300">
                          {getInitials(user.name)}
                        </div>
                        <span className="font-medium text-slate-200">
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-xs">
                      {user.email}
                    </td>
                    <td className="px-5 py-4">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={user.role}
                        disabled={updatingId === user.id}
                        onChange={(e) =>
                          handleRoleChange(user.id, e.target.value as Role)
                        }
                        className="select w-auto text-xs py-1.5 disabled:opacity-50 disabled:cursor-wait"
                      >
                        <option value="sales">Sales</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="space-y-3 p-4 md:hidden">
            {users.map((user) => (
              <div
                key={user.id}
                className="rounded-lg border border-[#1e2d4d] bg-[#0f1629] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-xs font-bold text-blue-300">
                      {getInitials(user.name)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-200">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <RoleBadge role={user.role} />
                </div>
                <div className="mt-3">
                  <select
                    value={user.role}
                    disabled={updatingId === user.id}
                    onChange={(e) =>
                      handleRoleChange(user.id, e.target.value as Role)
                    }
                    className="select text-xs py-1.5 disabled:opacity-50"
                  >
                    <option value="sales">Sales</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
