import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, ShieldAlert, Car, MoreHorizontal, CheckCircle2, Loader2 } from "lucide-react";
import { apiGet, apiPost } from "../lib/api";
import { getAuth } from "../lib/auth";
import { apiErrorMessage } from "../lib/driverErrors";
import { useLocale } from "../lib/i18n/LocaleContext";
import { useRealtimeRefresh } from "../lib/RealtimeContext";
import { RealtimeEventTypes } from "../lib/realtime";
import { ErrorBanner } from "./ErrorBanner";
import { CenteredSpinner } from "./CenteredSpinner";

type Incident = {
  incidentId: number;
  sessionId: number | null;
  ticketCode: string | null;
  reportedByName: string | null;
  incidentType: string;
  description: string | null;
  penaltyFee: number;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  plate?: string;
};

export function Violations() {
  const { t, formatMoney, formatDateTime, ts } = useLocale();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const auth = getAuth();
    setLoading(true);
    setError("");
    try {
      const data = await apiGet<Incident[]>("/api/incidents", auth?.token);
      setIncidents(data);
    } catch (e) {
      setError(apiErrorMessage(t, t("violations.loadFailed"))(e));
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  useRealtimeRefresh([RealtimeEventTypes.IncidentUpdated], load);

  const filtered = useMemo(() => {
    return incidents.filter((v) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !q ||
        (v.ticketCode?.toLowerCase().includes(q) ?? false) ||
        v.incidentType.toLowerCase().includes(q) ||
        String(v.incidentId).includes(q);
      const matchStatus = statusFilter === "all" || v.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [incidents, searchTerm, statusFilter]);

  const stats = useMemo(() => ({
    total: incidents.length,
    open: incidents.filter((i) => i.status === "Open").length,
    resolved: incidents.filter((i) => i.status === "Resolved").length,
  }), [incidents]);

  async function handleResolve(id: number) {
    const auth = getAuth();
    setResolvingId(id);
    try {
      await apiPost(`/api/incidents/${id}/resolve`, {}, auth?.token);
      await load();
    } catch (e) {
      setError(apiErrorMessage(t, t("violations.resolveFailed"))(e));
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-red-500" />
            {t("violations.title")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">{t("violations.subtitle")}</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t("violations.search")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-xl text-sm"
          >
            <option value="all">{t("common.all")}</option>
            <option value="Open">{t("violations.open")}</option>
            <option value="Resolved">{t("violations.resolved")}</option>
            <option value="Cancelled">{t("violations.cancelled")}</option>
          </select>
        </div>
      </div>

      <ErrorBanner error={error} className="mb-4" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: t("violations.total"), value: stats.total, bg: "bg-gray-50 dark:bg-gray-800/50" },
          { label: t("violations.open"), value: stats.open, bg: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400" },
          { label: t("violations.resolved"), value: stats.resolved, bg: "bg-blue-600/10 text-blue-600" },
        ].map((stat) => (
          <div key={stat.label} className={`p-6 rounded-2xl border border-gray-100 dark:border-gray-800 ${stat.bg}`}>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{stat.label}</p>
            <span className="text-3xl font-bold">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {loading ? (
          <CenteredSpinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-sm font-semibold text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-[#121212]/50">
                  <th className="py-4 px-6">{t("violations.codeTicket")}</th>
                  <th className="py-4 px-6">{t("violations.reporter")}</th>
                  <th className="py-4 px-6">{t("violations.violationType")}</th>
                  <th className="py-4 px-6">{t("common.time")}</th>
                  <th className="py-4 px-6">{t("violations.penalty")}</th>
                  <th className="py-4 px-6">{t("common.status")}</th>
                  <th className="py-4 px-6 text-right">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr key={v.incidentId} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                          <Car className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div>
                          <div className="font-mono font-bold text-gray-900 dark:text-white">{v.ticketCode ?? "—"}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">INC-{v.incidentId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">{v.reportedByName ?? "—"}</td>
                    <td className="py-4 px-6">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border border-red-100 dark:border-red-500/20">
                        {t(`incident.${v.incidentType}`)}
                      </div>
                      {v.description && (
                        <p className="text-xs text-gray-500 mt-1 max-w-xs truncate">{v.description}</p>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">{formatDateTime(v.createdAt)}</td>
                    <td className="py-4 px-6 font-bold text-gray-900 dark:text-white">{formatMoney(v.penaltyFee)}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        v.status === "Open"
                          ? "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20"
                          : "bg-blue-600/10 text-blue-600 border-blue-600/20"
                      }`}>
                        {ts(v.status)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {v.status === "Open" ? (
                        <button
                          onClick={() => handleResolve(v.incidentId)}
                          disabled={resolvingId === v.incidentId}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                          {resolvingId === v.incidentId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          {t("violations.resolve")}
                        </button>
                      ) : (
                        <button className="p-2 text-gray-400 rounded-lg" disabled>
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">{t("violations.empty")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
