import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { getAuth } from "./auth";
import {
  RealtimeEvent,
  RealtimeEventTypes,
  startRealtimeConnection,
  stopRealtimeConnection,
  subscribeRealtime,
  subscribeSlotUpdates,
  type SlotUpdateData,
} from "./realtime";

type RealtimeContextValue = {
  subscribe: (handler: (event: RealtimeEvent) => void) => () => void;
  subscribeSlots: (handler: (slot: SlotUpdateData) => void) => () => void;
  eventTypes: typeof RealtimeEventTypes;
};

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const auth = getAuth();
    if (auth?.token) {
      void startRealtimeConnection();
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === "pbms_auth" || e.key === null) {
        const next = getAuth();
        if (next?.token) void startRealtimeConnection();
        else void stopRealtimeConnection();
      }
    };

    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      void stopRealtimeConnection();
    };
  }, []);

  const value: RealtimeContextValue = {
    subscribe: subscribeRealtime,
    subscribeSlots: subscribeSlotUpdates,
    eventTypes: RealtimeEventTypes,
  };

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error("useRealtime must be used within RealtimeProvider");
  return ctx;
}

/** Re-run callback when matching realtime events arrive (debounced). */
export function useRealtimeRefresh(types: readonly string[], onRefresh: () => void) {
  const { subscribe } = useRealtime();
  const typesKey = types.join("|");
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    const allowed = new Set(typesKey.split("|"));
    let timer: ReturnType<typeof setTimeout> | null = null;

    return subscribe((evt) => {
      if (!allowed.has(evt.type) && !allowed.has("*")) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => onRefreshRef.current(), 500);
    });
  }, [subscribe, typesKey]);
}
