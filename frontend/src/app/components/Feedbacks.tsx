import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageSquare, Search, CheckCircle2, Loader2 } from "lucide-react";
import { apiGet, apiPut } from "../lib/api";
import { getAuth } from "../lib/auth";
import { apiErrorMessage } from "../lib/driverErrors";
import { useLocale } from "../lib/i18n/LocaleContext";
import { ErrorBanner } from "./ErrorBanner";
import { CenteredSpinner } from "./CenteredSpinner";

type FeedbackItem = {
  feedbackId: number;
  userId: number | null;
  userName: string | null;
  sessionId: number | null;
  ticketCode: string | null;
  feedbackType: string;
  content: string | null;
  status: string;
  createdAt: string;
};

const STATUS_OPTIONS = ["New", "Reviewed", "Resolved"] as const;

export function Feedbacks() {
  const { t, formatDateTime, ts } = useLocale();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const auth = getAuth();
    setLoading(true);
    setError("");
    try {
      const data = await apiGet<FeedbackItem[]>("/api/feedbacks", auth?.token);
      setItems(data);
    } catch (e) {
      setError(apiErrorMessage(t, t("feedbacks.loadFailed"))(e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return items.filter((f) => {
      const matchSearch =
        !q ||
        (f.userName?.toLowerCase().includes(q) ?? false) ||
        (f.content?.toLowerCase().includes(q) ?? false) ||
        f.feedbackType.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || f.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [items, searchTerm, statusFilter]);

  async function handleStatusChange(id: number, status: string) {
    const auth = getAuth();
    setUpdatingId(id);
    try {
      await apiPut(`/api/feedbacks/${id}/status`, { status }, auth?.token);
      await load();
    } catch (e) {
      setError(apiErrorMessage(t, t("feedbacks.updateFailed"))(e));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-7 h-7 text-blue-600" />
          {t("feedbacks.title")}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("feedbacks.subtitle")}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("feedbacks.searchPlaceholder")}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1A1A1A] text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1A1A1A] text-sm"
        >
          <option value="all">{t("feedbacks.filterAll")}</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {ts(s)}
            </option>
          ))}
        </select>
      </div>

      <ErrorBanner error={error} />

      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <CenteredSpinner className="py-16" size="lg" />
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-500 py-16 text-sm">{t("feedbacks.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-[#121212] text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">{t("feedbacks.colType")}</th>
                  <th className="px-4 py-3 text-left">{t("feedbacks.colUser")}</th>
                  <th className="px-4 py-3 text-left">{t("feedbacks.colContent")}</th>
                  <th className="px-4 py-3 text-left">{t("feedbacks.colStatus")}</th>
                  <th className="px-4 py-3 text-left">{t("feedbacks.colDate")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((f) => (
                  <tr key={f.feedbackId} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-3 font-medium">{f.feedbackType}</td>
                    <td className="px-4 py-3">{f.userName ?? "—"}</td>
                    <td className="px-4 py-3 max-w-xs truncate" title={f.content ?? ""}>
                      {f.content ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={f.status}
                        disabled={updatingId === f.feedbackId}
                        onChange={(e) => handleStatusChange(f.feedbackId, e.target.value)}
                        className="text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121212] px-2 py-1"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {ts(s)}
                          </option>
                        ))}
                      </select>
                      {updatingId === f.feedbackId && (
                        <Loader2 className="inline w-3 h-3 ml-1 animate-spin" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDateTime(f.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {t("feedbacks.count", { count: filtered.length })}
        </p>
      )}
    </div>
  );
}
