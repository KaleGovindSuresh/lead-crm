import type {
  LeadFiltersParams,
  LeadStatus,
  LeadSource,
  SortOption,
} from "../../types";

interface LeadFiltersProps {
  filters: LeadFiltersParams;
  onChange: (filters: LeadFiltersParams) => void;
  onReset: () => void;
}

const STATUS_OPTIONS: { value: LeadStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

const SOURCE_OPTIONS: { value: LeadSource | ""; label: string }[] = [
  { value: "", label: "All Sources" },
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "cold", label: "Cold" },
  { value: "other", label: "Other" },
];

const SORT_OPTIONS = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "name:asc", label: "Name A–Z" },
  { value: "name:desc", label: "Name Z–A" },
];

export const LeadFilters = ({
  filters,
  onChange,
  onReset,
}: LeadFiltersProps) => {
  const update = (patch: Partial<LeadFiltersParams>) =>
    onChange({ ...filters, ...patch, page: 1 });

  const hasActiveFilters =
    filters.q ||
    filters.status ||
    filters.source ||
    filters.createdFrom ||
    filters.createdTo;

  const currentSort = (filters.sort ?? "createdAt:desc") as SortOption | "";

  return (
    <div className="card p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* Search */}
        <div className="relative xl:col-span-2">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search name, email, phone…"
            value={filters.q ?? ""}
            onChange={(e) => update({ q: e.target.value })}
            className="input pl-9"
          />
        </div>

        {/* Status */}
        <select
          value={filters.status ?? ""}
          onChange={(e) =>
            update({ status: e.target.value as LeadStatus | "" })
          }
          className="select"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {/* Source */}
        <select
          value={filters.source ?? ""}
          onChange={(e) =>
            update({ source: e.target.value as LeadSource | "" })
          }
          className="select"
        >
          {SOURCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={currentSort}
          onChange={(e) => update({ sort: e.target.value as SortOption | "" })}
          className="select"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Date range row */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 whitespace-nowrap">
            From
          </label>
          <input
            type="date"
            value={filters.createdFrom ?? ""}
            onChange={(e) => update({ createdFrom: e.target.value })}
            className="input w-auto text-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 whitespace-nowrap">To</label>
          <input
            type="date"
            value={filters.createdTo ?? ""}
            onChange={(e) => update({ createdTo: e.target.value })}
            className="input w-auto text-xs"
          />
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="ml-auto flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
};
