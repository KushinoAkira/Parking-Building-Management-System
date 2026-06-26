import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { getAuth } from "./auth";

import { apiUrl } from "./api";

export type RealtimeEvent = {
  type: string;
  title?: string | null;
  message?: string | null;
  data?: unknown;
  atUtc: string;
};

export type SlotUpdateData = {
  slotId: string;
  zoneId: number;
  status: string;
  licensePlate?: string | null;
};

type EventHandler = (event: RealtimeEvent) => void;
type SlotHandler = (slot: SlotUpdateData) => void;

let connection: HubConnection | null = null;
let starting: Promise<void> | null = null;
const eventHandlers = new Set<EventHandler>();
const slotHandlers = new Set<SlotHandler>();

function hubUrl(token: string) {
  return apiUrl(`/hubs/parking?access_token=${encodeURIComponent(token)}`);
}

export function subscribeRealtime(handler: EventHandler) {
  eventHandlers.add(handler);
  return () => eventHandlers.delete(handler);
}

export function subscribeSlotUpdates(handler: SlotHandler) {
  slotHandlers.add(handler);
  return () => slotHandlers.delete(handler);
}

export function getRealtimeState() {
  return connection?.state ?? HubConnectionState.Disconnected;
}

export async function startRealtimeConnection() {
  const auth = getAuth();
  if (!auth?.token) return stopRealtimeConnection();

  if (connection?.state === HubConnectionState.Connected) return;
  if (starting) return starting;

  starting = (async () => {
    await stopRealtimeConnection();

    connection = new HubConnectionBuilder()
      .withUrl(hubUrl(auth.token), { withCredentials: true })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on("pbmsEvent", (evt: RealtimeEvent) => {
      eventHandlers.forEach((h) => h(evt));
    });

    connection.on("slotUpdated", (slot: SlotUpdateData) => {
      slotHandlers.forEach((h) => h(slot));
    });

    connection.onreconnected(() => {
      /* auto-reconnected */
    });

    await connection.start();
  })();

  try {
    await starting;
  } finally {
    starting = null;
  }
}

export async function stopRealtimeConnection() {
  if (connection) {
    try {
      await connection.stop();
    } catch {
      /* ignore */
    }
    connection = null;
  }
}

export const RealtimeEventTypes = {
  SessionCheckedIn: "sessionCheckedIn",
  SessionCheckedOut: "sessionCheckedOut",
  SlotUpdated: "slotUpdated",
  ReservationUpdated: "reservationUpdated",
  IncidentUpdated: "incidentUpdated",
  DashboardRefresh: "dashboardRefresh",
  WalletTopUpCompleted: "walletTopUpCompleted",
} as const;
