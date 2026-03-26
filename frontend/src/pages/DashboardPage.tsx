import { useState, useEffect, useCallback } from "react";
import { leadsApi } from "../api/leads.api";
import { DashboardCards } from "../components/Dashboard/DashboardCards";
import { PageLoader } from "../components/UI/Spinner";
import { ErrorState } from "../components/UI/States";
import type { LeadSummary } from "../types";

export const DashboardPage = () => {
  const [summary, setSummary] = useState<LeadSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: { createdFrom?: string; createdTo?: string } = {};
      if (dateFrom) params.createdFrom = dateFrom;
      if (dateTo) params.createdTo = dateTo;
      const summary = await leadsApi.getSummary(params);
      setSummary(summary);
    } catch {
      setError("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Overview of your lead pipeline
          </p>
        </div>

        {/* Date range filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 whitespace-nowrap">
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input w-auto text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 whitespace-nowrap">
              To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input w-auto text-xs"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Clear
            </button>
          )}
          <button onClick={fetchSummary} className="btn-secondary text-xs">
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchSummary} />
      ) : summary ? (
        <DashboardCards summary={summary} />
      ) : null}
    </div>
  );
};
