import type { LeadSummary, LeadStatus, LeadSource } from "../../types";
import { capitalize } from "../../utils/formatters";

interface DashboardCardsProps {
  summary: LeadSummary;
}

const statusColors: Record<
  LeadStatus,
  { bar: string; text: string; bg: string }
> = {
  new: { bar: "bg-blue-500", text: "text-blue-300", bg: "bg-blue-500/10" },
  contacted: {
    bar: "bg-yellow-500",
    text: "text-yellow-300",
    bg: "bg-yellow-500/10",
  },
  qualified: {
    bar: "bg-purple-500",
    text: "text-purple-300",
    bg: "bg-purple-500/10",
  },
  won: { bar: "bg-green-500", text: "text-green-300", bg: "bg-green-500/10" },
  lost: { bar: "bg-red-500", text: "text-red-300", bg: "bg-red-500/10" },
};

const sourceColors: Record<
  LeadSource,
  { bar: string; text: string; bg: string }
> = {
  website: { bar: "bg-cyan-500", text: "text-cyan-300", bg: "bg-cyan-500/10" },
  referral: {
    bar: "bg-violet-500",
    text: "text-violet-300",
    bg: "bg-violet-500/10",
  },
  cold: {
    bar: "bg-orange-500",
    text: "text-orange-300",
    bg: "bg-orange-500/10",
  },
  other: { bar: "bg-slate-500", text: "text-slate-300", bg: "bg-slate-500/10" },
};

const StatBar = ({
  label,
  value,
  total,
  colors,
}: {
  label: string;
  value: number;
  total: number;
  colors: { bar: string; text: string; bg: string };
}) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${colors.bg}`}
      >
        <span className={`text-xs font-bold ${colors.text}`}>{pct}%</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-400">{capitalize(label)}</span>
          <span className="text-xs font-semibold text-slate-300">{value}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-700 ${colors.bar}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export const DashboardCards = ({ summary }: DashboardCardsProps) => {
  const statusEntries = Object.entries(summary.byStatus) as [
    LeadStatus,
    number,
  ][];
  const sourceEntries = Object.entries(summary.bySource) as [
    LeadSource,
    number,
  ][];
  const wonCount = summary.byStatus.won ?? 0;
  const conversionRate =
    summary.total > 0 ? Math.round((wonCount / summary.total) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total */}
        <div className="card p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">
            Total Leads
          </p>
          <p className="mt-2 text-4xl font-bold text-slate-100">
            {summary.total}
          </p>
          <p className="mt-1 text-xs text-slate-600">All time</p>
        </div>

        {/* Won */}
        <div className="card p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">
            Won
          </p>
          <p className="mt-2 text-4xl font-bold text-green-400">{wonCount}</p>
          <p className="mt-1 text-xs text-slate-600">Closed deals</p>
        </div>

        {/* Conversion */}
        <div className="card p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">
            Conversion
          </p>
          <p className="mt-2 text-4xl font-bold text-blue-400">
            {conversionRate}%
          </p>
          <p className="mt-1 text-xs text-slate-600">Win rate</p>
        </div>

        {/* Active */}
        <div className="card p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">
            Active
          </p>
          <p className="mt-2 text-4xl font-bold text-purple-400">
            {(summary.byStatus.new ?? 0) +
              (summary.byStatus.contacted ?? 0) +
              (summary.byStatus.qualified ?? 0)}
          </p>
          <p className="mt-1 text-xs text-slate-600">In pipeline</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* By Status */}
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-300">
            Leads by Status
          </h2>
          <div className="space-y-3">
            {statusEntries.map(([status, count]) => (
              <StatBar
                key={status}
                label={status}
                value={count}
                total={summary.total}
                colors={statusColors[status]}
              />
            ))}
          </div>
        </div>

        {/* By Source */}
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-300">
            Leads by Source
          </h2>
          <div className="space-y-3">
            {sourceEntries.map(([source, count]) => (
              <StatBar
                key={source}
                label={source}
                value={count}
                total={summary.total}
                colors={sourceColors[source]}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
