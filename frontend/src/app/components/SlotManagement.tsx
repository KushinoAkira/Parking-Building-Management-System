import { useCallback, useEffect, useMemo, useState } from "react";
import { Car, Search, Filter, Info, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { apiGet } from "../lib/api";
import { getAuth } from "../lib/auth";
import { useLocale } from "../lib/i18n/LocaleContext";
import { useRealtimeRefresh } from "../lib/RealtimeContext";
import { RealtimeEventTypes } from "../lib/realtime";
import { allSlotsForFloor, type StaffFloor, type StaffFloorSlot } from "../lib/parkingFloors";
import { slotTier } from "../lib/parkingSlots";

type SlotVm = {
  id: string;
  name: string;
  status: "free" | "occupied" | "reserved" | "violation";
  type: "VIP" | "Standard";
  plate: string | null;
  checkIn: string | null;
  sectionName: string;
};

function mapSlot(slot: StaffFloorSlot, sectionName: string): SlotVm {
  return {
    id: slot.slotId,
    name: slot.slotId,
    status:
      slot.status === "Occupied"
        ? "occupied"
        : slot.status === "Reserved"
          ? "reserved"
          : "free",
    type: slotTier(slot.slotId, slot.note),
    plate: slot.activeSession?.licensePlate ?? null,
    checkIn: slot.activeSession?.entryTime ?? null,
    sectionName,
  };
}

export function SlotManagement() {
  const { t, formatDateTime, ts } = useLocale();
  const [floors, setFloors] = useState<StaffFloor[]>([]);
  const [activeFloorId, setActiveFloorId] = useState<number | null>(null);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<SlotVm | null>(null);

  const loadFloors = useCallback(() => {
    const auth = getAuth();
    apiGet<StaffFloor[]>("/api/portal/staff/floors", auth?.token)
      .then((data) => {
        setFloors(data);
        if (data.length > 0) setActiveFloorId((prev) => prev ?? data[0].floorId);
      })
      .catch(() => setFloors([]));
  }, []);

  useEffect(() => {
    loadFloors();
  }, [loadFloors]);

  useRealtimeRefresh(
    [
      RealtimeEventTypes.SlotUpdated,
      RealtimeEventTypes.SessionCheckedIn,
      RealtimeEventTypes.SessionCheckedOut,
      RealtimeEventTypes.ReservationUpdated,
    ],
    loadFloors,
  );

  const activeFloor = useMemo(
    () => floors.find((f) => f.floorId === activeFloorId) ?? floors[0],
    [floors, activeFloorId],
  );

  const activeSlots = useMemo(
    () =>
      activeFloor
        ? activeFloor.sections.flatMap((section) =>
            section.slots.map((slot) => mapSlot(slot, section.sectionName)),
          )
        : [],
    [activeFloor],
  );

  if (!activeFloor) {
    return (
      <div className="p-6 bg-white dark:bg-[#1A1A1A] rounded-xl border border-gray-200 dark:border-gray-800">
        {t("slots.noData")}
      </div>
    );
  }

  const filteredSlots = activeSlots.filter(slot => {
    if (filter === "free" && slot.status !== "free") return false;
    if (filter === "occupied" && slot.status !== "occupied") return false;
    if (filter === "reserved" && slot.status !== "reserved") return false;
    if (filter === "violation" && slot.status !== "violation") return false;
    if (searchQuery && slot.plate && !slot.plate.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (searchQuery && !slot.plate && slot.name.toLowerCase().includes(searchQuery.toLowerCase())) return true;
    if (searchQuery && !slot.plate) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header & Controls */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("slots.title")}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t("slots.subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t("slots.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-xl pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
            />
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Filter className="w-4 h-4" />
            {t("common.filter")}
          </motion.button>
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Main Grid Area */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col min-h-[500px] shadow-sm"
        >
          {/* Tabs & Status Filters */}
          <div className="flex flex-wrap justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800 gap-4">
            <div className="flex bg-gray-100 dark:bg-[#121212] p-1 rounded-xl border border-gray-200 dark:border-gray-800 overflow-x-auto max-w-full relative" style={{ scrollbarWidth: 'none' }}>
              {floors.map((floor) => (
                <button
                  key={floor.floorId}
                  onClick={() => { setActiveFloorId(floor.floorId); setSelectedSlot(null); }}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap relative z-10 ${
                    activeFloor.floorId === floor.floorId
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  {activeFloor.floorId === floor.floorId && (
                    <motion.div layoutId="slot-floor-tab" className="absolute inset-0 bg-white dark:bg-gray-800 rounded-lg shadow-sm -z-10" />
                  )}
                  {floor.floorName}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#121212] p-1 rounded-xl border border-gray-200 dark:border-gray-800 overflow-x-auto max-w-full relative" style={{ scrollbarWidth: 'none' }}>
              <button
                onClick={() => setFilter("all")}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors relative z-10 ${filter === 'all' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
              >
                {filter === 'all' && <motion.div layoutId="slot-filter-tab" className="absolute inset-0 bg-white dark:bg-gray-800 rounded-lg shadow-sm -z-10" />}
                {t("common.all")} ({activeSlots.length})
              </button>
              <button
                onClick={() => setFilter("free")}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 relative z-10 ${filter === 'free' ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'}`}
              >
                {filter === 'free' && <motion.div layoutId="slot-filter-tab" className="absolute inset-0 bg-blue-600/15 dark:bg-blue-600/20 rounded-lg shadow-sm -z-10" />}
                <div className="w-2 h-2 rounded-full bg-blue-600" />
                {t("common.free")} ({activeSlots.filter(s => s.status === 'free').length})
              </button>
              <button
                onClick={() => setFilter("occupied")}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 relative z-10 ${filter === 'occupied' ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}
              >
                {filter === 'occupied' && <motion.div layoutId="slot-filter-tab" className="absolute inset-0 bg-red-50 dark:bg-red-500/15 rounded-lg shadow-sm -z-10" />}
                <div className="w-2 h-2 rounded-full bg-red-500" />
                {t("common.occupied")} ({activeSlots.filter(s => s.status === 'occupied').length})
              </button>
              <button
                onClick={() => setFilter("reserved")}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 relative z-10 ${filter === 'reserved' ? 'text-amber-600' : 'text-gray-500 dark:text-gray-400'}`}
              >
                {filter === 'reserved' && <motion.div layoutId="slot-filter-tab" className="absolute inset-0 bg-amber-50 dark:bg-amber-500/15 rounded-lg shadow-sm -z-10" />}
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                {t("common.reserved")} ({activeSlots.filter(s => s.status === 'reserved').length})
              </button>
              <button
                onClick={() => setFilter("violation")}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 relative z-10 ${filter === 'violation' ? 'text-yellow-600' : 'text-gray-500 dark:text-gray-400'}`}
              >
                {filter === 'violation' && <motion.div layoutId="slot-filter-tab" className="absolute inset-0 bg-yellow-50 dark:bg-yellow-500/15 rounded-lg shadow-sm -z-10" />}
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                {t("common.violation")} ({activeSlots.filter(s => s.status === 'violation').length})
              </button>
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {activeFloor.sections.map((section) => {
              const sectionSlots = section.slots
                .map((slot) => mapSlot(slot, section.sectionName))
                .filter((slot) => {
                  if (filter === "free" && slot.status !== "free") return false;
                  if (filter === "occupied" && slot.status !== "occupied") return false;
                  if (filter === "reserved" && slot.status !== "reserved") return false;
                  if (filter === "violation" && slot.status !== "violation") return false;
                  if (searchQuery && slot.plate && !slot.plate.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                  if (searchQuery && !slot.plate && slot.name.toLowerCase().includes(searchQuery.toLowerCase())) return true;
                  if (searchQuery && !slot.plate) return false;
                  return true;
                });

              if (sectionSlots.length === 0 && (filter !== "all" || searchQuery)) return null;

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
                    {sectionSlots.map((slot) => (
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot)}
                        className={`
                          relative flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all cursor-pointer min-h-[96px]
                          ${selectedSlot?.id === slot.id ? 'ring-2 ring-blue-600 ring-offset-2 ring-offset-white dark:ring-offset-[#1A1A1A] scale-105 z-10' : ''}
                          ${slot.status === 'occupied'
                            ? "border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-500 hover:border-red-300 dark:hover:border-red-500/50"
                            : slot.status === 'reserved'
                            ? "border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 hover:border-amber-400 dark:hover:border-amber-500/60"
                            : slot.status === 'violation'
                            ? "border-yellow-300 dark:border-yellow-500/40 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 hover:border-yellow-400 dark:hover:border-yellow-500/60"
                            : "border-blue-600/20 dark:border-blue-600/30 bg-blue-600/5 dark:bg-blue-600/10 text-blue-600 hover:border-blue-600/40 hover:bg-blue-600/10"
                          }
                        `}
                      >
                        {slot.type === "VIP" && (
                          <span className="absolute top-1.5 right-1.5 text-[8px] font-bold bg-gray-900/10 dark:bg-white/10 px-1 rounded">VIP</span>
                        )}
                        <div className="text-xs font-bold opacity-90">{slot.name}</div>
                        <div className="flex-1 flex items-center justify-center min-h-[32px]">
                          <Car className={`w-6 h-6 transition-all duration-300 ${slot.status !== 'free' ? "opacity-100 scale-100" : "opacity-30 scale-90"}`} />
                        </div>
                        <div className="h-[18px] flex items-center justify-center mt-0.5">
                          {slot.plate && (
                            <span className="bg-gray-900/80 dark:bg-black/60 px-1.5 py-0.5 rounded text-[9px] text-white font-mono whitespace-nowrap">
                              {slot.plate}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
            {filteredSlots.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 py-16"
              >
                <Search className="w-12 h-12 mb-3 opacity-20" />
                <p>{t("slots.noResults")}</p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Side Panel */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full lg:w-80 bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex flex-col shrink-0 shadow-sm"
        >
          <h2 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-4 mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            {t("slots.detailTitle")}
          </h2>

          <AnimatePresence mode="wait">
            {selectedSlot ? (
              <motion.div 
                key={selectedSlot.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, transition: { duration: 0.1 } }}
                className="flex-1 flex flex-col space-y-5"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{selectedSlot.name}</div>
                    <div className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t("staff.code")}: {selectedSlot.id}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    selectedSlot.type === 'VIP' ? 'bg-yellow-50 dark:bg-yellow-500/15 text-yellow-600 dark:text-yellow-400' : 'bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400'
                  }`}>
                    {selectedSlot.type}
                  </span>
                </div>

                <div className="bg-gray-50 dark:bg-[#121212] rounded-xl p-4 border border-gray-100 dark:border-gray-800 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">{t("common.status")}</span>
                    <div className={`flex items-center gap-1.5 text-sm font-bold ${
                      selectedSlot.status === 'occupied' ? 'text-red-500' :
                      selectedSlot.status === 'reserved' ? 'text-amber-600 dark:text-amber-500' :
                      selectedSlot.status === 'violation' ? 'text-yellow-600 dark:text-yellow-500' :
                      'text-blue-600'
                    }`}>
                      {selectedSlot.status === 'free' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      {selectedSlot.status === 'occupied'
                        ? t("common.occupied")
                        : selectedSlot.status === 'reserved'
                          ? t("common.reserved")
                          : selectedSlot.status === 'violation'
                            ? t("common.violation")
                            : ts("Available")}
                    </div>
                  </div>

                  {selectedSlot.status !== 'free' && (
                    <>
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
                        <span className="text-gray-500 dark:text-gray-400 text-sm">{t("common.plate")}</span>
                        <span className="text-gray-900 dark:text-white font-mono font-bold bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded-lg text-sm">
                          {selectedSlot.plate}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 dark:text-gray-400 text-sm">{t("slots.checkInLabel")}</span>
                        <span className="text-gray-700 dark:text-gray-300 text-sm flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {formatDateTime(selectedSlot.checkIn)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-auto pt-4 space-y-3">
                  {selectedSlot.status !== 'free' ? (
                    <>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full border-2 border-red-200 dark:border-red-500/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 font-bold py-2.5 rounded-xl transition-colors text-sm">
                        {t("slots.checkoutRecord")}
                      </motion.button>
                      {selectedSlot.status === 'violation' && (
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-500/20 font-bold py-2.5 rounded-xl transition-colors text-sm border border-yellow-200 dark:border-yellow-500/30">
                          {t("slots.handleViolation")}
                        </motion.button>
                      )}
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium py-2.5 rounded-xl transition-colors text-sm">
                        {t("slots.viewHistory")}
                      </motion.button>
                    </>
                  ) : (
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full bg-blue-600 text-white hover:bg-blue-600/90 font-bold py-2.5 rounded-xl transition-colors text-sm shadow-md shadow-blue-600/20">
                      {t("slots.lockSlot")}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 dark:text-gray-500 space-y-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Car className="w-8 h-8 opacity-40" />
                </div>
                <p className="text-sm">{t("slots.selectPrompt")}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
