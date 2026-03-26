import type { LeadStatus, LeadSource } from "../../types";
import { capitalize } from "../../utils/formatters";

export const StatusBadge = ({ status }: { status: LeadStatus }) => {
  const cls: Record<LeadStatus, string> = {
    new: "badge-new",
    contacted: "badge-contacted",
    qualified: "badge-qualified",
    won: "badge-won",
    lost: "badge-lost",
  };
  return <span className={cls[status]}>{capitalize(status)}</span>;
};

export const SourceBadge = ({ source }: { source: LeadSource }) => {
  const cls: Record<LeadSource, string> = {
    website: "badge bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
    referral:
      "badge bg-violet-500/20 text-violet-300 border border-violet-500/30",
    cold: "badge bg-orange-500/20 text-orange-300 border border-orange-500/30",
    other: "badge bg-slate-500/20 text-slate-300 border border-slate-500/30",
  };
  return <span className={cls[source]}>{capitalize(source)}</span>;
};

export const RoleBadge = ({ role }: { role: string }) => {
  const cls: Record<string, string> = {
    admin: "badge bg-red-500/20 text-red-300 border border-red-500/30",
    manager: "badge bg-amber-500/20 text-amber-300 border border-amber-500/30",
    sales: "badge bg-blue-500/20 text-blue-300 border border-blue-500/30",
  };
  return (
    <span className={cls[role] ?? "badge bg-slate-500/20 text-slate-300"}>
      {capitalize(role)}
    </span>
  );
};
