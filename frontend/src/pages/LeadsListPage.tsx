import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { leadsApi } from "../api/leads.api";
import { LeadFilters } from "../components/Leads/LeadFilters";
import { LeadsTable } from "../components/Leads/LeadsTable";
import { Spinner } from "../components/UI/Spinner";
import { EmptyState, ErrorState } from "../components/UI/States";
import { usePermissions } from "../hooks/usePermissions";
import { useToast } from "../context/ToastContext";
import type { Lead, LeadFiltersParams } from "../types";

const DEFAULT_FILTERS: LeadFiltersParams = {
  q: "",
  status: "",
  source: "",
  createdFrom: "",
  createdTo: "",
  sort: "createdAt:desc",
  page: 1,
  limit: 15,
};

export const LeadsListPage = () => {
  const { can } = usePermissions();
  const showToast = useToast();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<LeadFiltersParams>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchLeads = useCallback(async (params: LeadFiltersParams) => {
    setIsLoading(true);
    setError(null);
    try {
      // Strip empty strings so they don't pollute query params
      const clean: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(params)) {
        if (v !== "" && v !== undefined && v !== null) clean[k] = v;
      }
      const result = await leadsApi.getLeads(clean as LeadFiltersParams);
      setLeads(result.data);
      setTotal(result.pagination.total);
      setTotalPages(result.pagination.totalPages);
    } catch {
      setError("Failed to load leads. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads(filters);
  }, [filters]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await leadsApi.deleteLead(id);
      showToast("Lead deleted", "success");
      fetchLeads(filters);
    } catch {
      showToast("Failed to delete lead", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    setFilters((f) => ({ ...f, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const page = filters.page ?? 1;

  return (
    <div className="animate-fade-in space-y-5">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Leads</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isLoading
              ? "Loading…"
              : `${total} lead${total !== 1 ? "s" : ""} found`}
          </p>
        </div>
        {can("lead:write") && (
          <Link to="/leads/new" className="btn-primary">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Lead
          </Link>
        )}
      </div>

      {/* Filters */}
      <LeadFilters
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      {/* Content */}
      {error ? (
        <ErrorState message={error} onRetry={() => fetchLeads(filters)} />
      ) : isLoading ? (
        <div className="card flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : leads.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No leads found"
            description="Try adjusting your filters or add a new lead."
            action={
              can("lead:write") ? (
                <Link to="/leads/new" className="btn-primary text-sm">
                  Add your first lead
                </Link>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <LeadsTable
            leads={leads}
            onDelete={handleDelete}
            isDeleting={deletingId}
          />
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages} · {total} total
          </p>
          <div className="flex items-center gap-1.5">
            <button
              className="btn-secondary text-xs px-3 py-2"
              disabled={page <= 1}
              onClick={() => handlePageChange(1)}
            >
              «
            </button>
            <button
              className="btn-secondary text-xs px-3 py-2"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
            >
              ‹ Prev
            </button>
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p: number;
              if (totalPages <= 5) {
                p = i + 1;
              } else if (page <= 3) {
                p = i + 1;
              } else if (page >= totalPages - 2) {
                p = totalPages - 4 + i;
              } else {
                p = page - 2 + i;
              }
              return (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                    p === page
                      ? "border-blue-500/40 bg-blue-600/20 text-blue-300"
                      : "border-[#1e2d4d] bg-[#131c35] text-slate-400 hover:bg-[#1a2440] hover:text-slate-200"
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              className="btn-secondary text-xs px-3 py-2"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              Next ›
            </button>
            <button
              className="btn-secondary text-xs px-3 py-2"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(totalPages)}
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
