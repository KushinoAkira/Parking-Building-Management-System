import { useState } from "react";
import { MapPin, Search } from "lucide-react";
import { apiGet } from "../lib/api";
import { useLocale } from "../lib/i18n/LocaleContext";
import { toDriverErrorMessage } from "../lib/driverErrors";
import { ErrorBanner } from "./ErrorBanner";

type ActiveSession = {
  sessionId: number;
  ticketCode: string;
  licensePlate: string;
  vehicleTypeCode: string;
  zoneCode: string;
  slotId: string;
};

function floorFromZone(zoneCode: string): string | null {
  return /^F(\d+)/.exec(zoneCode)?.[1] ?? null;
}

export function VehicleLocator({ authToken }: { authToken: string }) {
  const { t, tv } = useLocale();
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<ActiveSession[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function search(e: React.FormEvent) {
    e.preventDefault();
    const plate = term.trim();
    if (!plate || loading) return;
    setLoading(true);
    setError("");
    try {
      setResults(
        await apiGet<ActiveSession[]>(
          `/api/parking-sessions/search?plate=${encodeURIComponent(plate)}`,
          authToken,
        ),
      );
    } catch (err) {
      setResults(null);
      setError(toDriverErrorMessage(err, t, t("staff.locateError")));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
        <h2 className="font-bold text-gray-900 dark:text-white mb-1">{t("staff.locateTitle")}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{t("staff.locateHint")}</p>
        <form className="flex gap-2" onSubmit={search}>
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value.toUpperCase())}
            placeholder={t("staff.platePlaceholder")}
            className="flex-1 min-w-0 bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 font-mono uppercase"
          />
          <button
            disabled={loading || !term.trim()}
            className="px-5 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            {loading ? t("staff.processing") : t("staff.locateSearch")}
          </button>
        </form>
      </div>

      <ErrorBanner error={error} />

      {results !== null && results.length === 0 && !error && (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-6 text-center text-sm text-gray-400">
          {t("staff.locateNotFound")}
        </div>
      )}

      {results?.map((s) => (
        <div
          key={s.sessionId}
          className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold font-mono text-gray-900 dark:text-white">{s.licensePlate}</span>
            <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-blue-600/10 text-blue-600">
              {tv(s.vehicleTypeCode)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-900 dark:text-white">
            <MapPin className="w-5 h-5 text-blue-600 shrink-0" />
            <span className="font-semibold">
              {floorFromZone(s.zoneCode) ? `${t("staff.locateFloor")} ${floorFromZone(s.zoneCode)} · ` : ""}
              {t("staff.locateZone")} {s.zoneCode} · {t("staff.locateSlot")} {s.slotId}
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-mono">
            {t("staff.locateTicket")}: {s.ticketCode}
          </div>
        </div>
      ))}
    </div>
  );
}
