import { useMemo, useState } from "react";
import { Car, CheckCircle, Clock, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLocale } from "../lib/i18n/LocaleContext";

export type MapSlot = {
  slotId: string;
  status: string;
  activeSession?: {
    licensePlate: string;
    entryTime: string;
    ticketCode?: string;
  } | null;
};

export type MapFloor = {
  zoneId: number;
  zoneCode: string;
  zoneName: string;
  slots: MapSlot[];
};

type UiStatus = "free" | "occupied" | "reserved";

function mapStatus(status: string): UiStatus {
  if (status === "Occupied") return "occupied";
  if (status === "Reserved") return "reserved";
  return "free";
}

type Props = {
  floors: MapFloor[];
  activeZoneId: number | null;
  onZoneChange: (zoneId: number) => void;
  onOccupiedSlotClick?: (slot: MapSlot) => void;
};

export function ParkingSlotMap({ floors, activeZoneId, onZoneChange, onOccupiedSlotClick }: Props) {
  const { t, formatDateTime, ts } = useLocale();
  const [filter, setFilter] = useState<"all" | UiStatus>("all");
  const [selectedSlot, setSelectedSlot] = useState<MapSlot | null>(null);

  const activeFloor = useMemo(
    () => floors.find((f) => f.zoneId === activeZoneId) ?? floors[0],
    [floors, activeZoneId],
  );

  const slots = activeFloor?.slots ?? [];

  const counts = useMemo(() => ({
    total: slots.length,
    free: slots.filter((s) => mapStatus(s.status) === "free").length,
    occupied: slots.filter((s) => mapStatus(s.status) === "occupied").length,
    reserved: slots.filter((s) => mapStatus(s.status) === "reserved").length,
  }), [slots]);

  const filtered = slots.filter((s) => {
    if (filter === "all") return true;
    return mapStatus(s.status) === filter;
  });

  function statusLabel(ui: UiStatus) {
    if (ui === "free") return ts("Available");
    if (ui === "occupied") return ts("Occupied");
    return ts("Reserved");
  }

  if (!activeFloor) {
    return (
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center text-gray-500">
        {t("slots.noData")}
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
      <div className="flex-1 bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col min-h-[420px] shadow-sm">
        <div className="flex flex-wrap justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800 gap-3">
          <div className="flex bg-gray-100 dark:bg-[#121212] p-1 rounded-xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
            {floors.map((floor) => (
              <button
                key={floor.zoneId}
                onClick={() => { onZoneChange(floor.zoneId); setSelectedSlot(null); }}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium relative z-10 whitespace-nowrap ${
                  activeFloor.zoneId === floor.zoneId
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {activeFloor.zoneId === floor.zoneId && (
                  <motion.div layoutId="staff-slot-floor-tab" className="absolute inset-0 bg-white dark:bg-gray-800 rounded-lg shadow-sm -z-10" />
                )}
                {floor.zoneName}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1 bg-gray-100 dark:bg-[#121212] p-1 rounded-xl border border-gray-200 dark:border-gray-800">
            {([
              ["all", `${t("common.all")} (${counts.total})`, ""],
              ["free", `${t("common.free")} (${counts.free})`, "bg-blue-600"],
              ["occupied", `${t("common.occupied")} (${counts.occupied})`, "bg-red-500"],
              ["reserved", `${t("common.reserved")} (${counts.reserved})`, "bg-amber-500"],
            ] as const).map(([key, label, dot]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${
                  filter === key ? "bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white" : "text-gray-500"
                }`}
              >
                {dot && <span className={`w-2 h-2 rounded-full ${dot}`} />}
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 p-4 border-b border-gray-100 dark:border-gray-800">
          {[
            { label: t("dashboard.totalSlots"), value: counts.total, cls: "text-gray-900 dark:text-white" },
            { label: t("common.free"), value: counts.free, cls: "text-blue-600" },
            { label: t("common.occupied"), value: counts.occupied, cls: "text-red-500" },
            { label: t("common.reserved"), value: counts.reserved, cls: "text-amber-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-gray-100 dark:border-gray-800 p-3 text-center bg-gray-50 dark:bg-[#121212]">
              <div className={`text-xl font-bold ${s.cls}`}>{s.value}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {filtered.map((slot) => {
              const ui = mapStatus(slot.status);
              return (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04 }}
                  key={slot.slotId}
                  onClick={() => {
                    setSelectedSlot(slot);
                    if (ui === "occupied" && slot.activeSession) onOccupiedSlotClick?.(slot);
                  }}
                  className={`relative flex flex-col items-center justify-center p-2 rounded-xl border-2 min-h-[96px] transition-all ${
                    selectedSlot?.slotId === slot.slotId ? "ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-[#1A1A1A]" : ""
                  } ${
                    ui === "occupied"
                      ? "border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-500"
                      : ui === "reserved"
                        ? "border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 text-amber-600"
                        : "border-blue-600/20 bg-blue-600/5 dark:bg-blue-600/10 text-blue-600"
                  }`}
                >
                  <div className="text-xs font-bold">{slot.slotId}</div>
                  <div className="flex-1 flex items-center justify-center min-h-[32px]">
                    <Car className={`w-6 h-6 ${ui !== "free" ? "opacity-100" : "opacity-30"}`} />
                  </div>
                  {slot.activeSession?.licensePlate && (
                    <span className="bg-gray-900/80 dark:bg-black/60 px-1.5 py-0.5 rounded text-[9px] text-white font-mono truncate max-w-full">
                      {slot.activeSession.licensePlate}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-72 bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shrink-0 shadow-sm">
        <h3 className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 mb-4 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600" />
          {t("slots.detailTitle")}
        </h3>
        <AnimatePresence mode="wait">
          {selectedSlot ? (
            <motion.div key={selectedSlot.slotId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div>
                <div className="text-2xl font-bold">{selectedSlot.slotId}</div>
                <div className="text-xs text-gray-400">{activeFloor.zoneName}</div>
              </div>
              <div className="bg-gray-50 dark:bg-[#121212] rounded-xl p-3 border border-gray-100 dark:border-gray-800 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("common.status")}</span>
                  <span className="font-semibold">{statusLabel(mapStatus(selectedSlot.status))}</span>
                </div>
                {selectedSlot.activeSession && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t("common.plate")}</span>
                      <span className="font-mono font-bold">{selectedSlot.activeSession.licensePlate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">{t("slots.checkInLabel")}</span>
                      <span className="flex items-center gap-1 text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDateTime(selectedSlot.activeSession.entryTime)}
                      </span>
                    </div>
                  </>
                )}
              </div>
              {mapStatus(selectedSlot.status) === "occupied" && selectedSlot.activeSession && (
                <button
                  type="button"
                  onClick={() => onOccupiedSlotClick?.(selectedSlot)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-semibold"
                >
                  {t("slots.checkoutBtn")}
                </button>
              )}
              {mapStatus(selectedSlot.status) === "free" && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <CheckCircle className="w-4 h-4" />
                  {t("slots.readyCheckin")}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.p key="empty" className="text-sm text-gray-400 text-center py-8">
              {t("slots.selectPrompt")}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
