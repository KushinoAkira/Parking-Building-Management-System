import { useMemo, useState } from "react";
import { Car, CheckCircle, Clock, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLocale } from "../lib/i18n/LocaleContext";
import { allSlotsForFloor, type StaffFloor, type StaffFloorSlot } from "../lib/parkingFloors";
import { isVipSlot } from "../lib/parkingSlots";

type UiStatus = "free" | "occupied" | "reserved";

function mapStatus(status: string): UiStatus {
  if (status === "Occupied") return "occupied";
  if (status === "Reserved") return "reserved";
  return "free";
}

type Props = {
  floors: StaffFloor[];
  activeFloorId: number | null;
  onFloorChange: (floorId: number) => void;
  onOccupiedSlotClick?: (slot: StaffFloorSlot) => void;
};

export function ParkingSlotMap({ floors, activeFloorId, onFloorChange, onOccupiedSlotClick }: Props) {
  const { t, formatDateTime, ts } = useLocale();
  const [filter, setFilter] = useState<"all" | UiStatus>("all");
  const [selectedSlot, setSelectedSlot] = useState<StaffFloorSlot | null>(null);

  const activeFloor = useMemo(
    () => floors.find((f) => f.floorId === activeFloorId) ?? floors[0],
    [floors, activeFloorId],
  );

  const slots = useMemo(() => (activeFloor ? allSlotsForFloor(activeFloor) : []), [activeFloor]);

  const selectedSection = useMemo(() => {
    if (!activeFloor || !selectedSlot) return null;
    return activeFloor.sections.find((section) =>
      section.slots.some((slot) => slot.slotId === selectedSlot.slotId),
    );
  }, [activeFloor, selectedSlot]);

  const counts = useMemo(() => ({
    total: slots.length,
    free: slots.filter((s) => mapStatus(s.status) === "free").length,
    occupied: slots.filter((s) => mapStatus(s.status) === "occupied").length,
    reserved: slots.filter((s) => mapStatus(s.status) === "reserved").length,
  }), [slots]);

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
                key={floor.floorId}
                onClick={() => { onFloorChange(floor.floorId); setSelectedSlot(null); }}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium relative z-10 whitespace-nowrap ${
                  activeFloor.floorId === floor.floorId
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {activeFloor.floorId === floor.floorId && (
                  <motion.div layoutId="staff-slot-floor-tab" className="absolute inset-0 bg-white dark:bg-gray-800 rounded-lg shadow-sm -z-10" />
                )}
                {floor.floorName}
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

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {activeFloor.sections.map((section) => {
            const sectionSlots = section.slots.filter((slot) => {
              if (filter === "all") return true;
              return mapStatus(slot.status) === filter;
            });
            if (sectionSlots.length === 0 && filter !== "all") return null;

            return (
              <div key={section.zoneId}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    {section.sectionName}
                    {section.isElectric && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        {t("slots.evZone")}
                      </span>
                    )}
                  </h3>
                  <span className="text-xs text-gray-500">{sectionSlots.length}/{section.capacity}</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {sectionSlots.map((slot) => {
                    const ui = mapStatus(slot.status);
                    return (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.04 }}
                        key={slot.slotId}
                        onClick={() => setSelectedSlot(slot)}
                        className={`relative flex flex-col items-center justify-center p-2 rounded-xl border-2 min-h-[96px] transition-all ${
                          selectedSlot?.slotId === slot.slotId ? "ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-[#1A1A1A]" : ""
                        } ${
                          isVipSlot(slot.slotId) ? "ring-1 ring-yellow-400/40" : ""
                        } ${
                          ui === "occupied"
                            ? "border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-500"
                            : ui === "reserved"
                              ? "border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 text-amber-600"
                              : "border-blue-600/20 bg-blue-600/5 dark:bg-blue-600/10 text-blue-600"
                        }`}
                      >
                        {isVipSlot(slot.slotId) && (
                          <span className="absolute top-1.5 right-1.5 text-[8px] font-bold bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-1 rounded">
                            VIP
                          </span>
                        )}
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
            );
          })}
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
                <div className="text-xs text-gray-400">{selectedSection?.zoneName ?? activeFloor.floorName}</div>
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
