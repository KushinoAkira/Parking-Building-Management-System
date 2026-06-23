import { RealtimeEventTypes } from "./realtime";

export const driverRealtimeRefreshEvents = [
  RealtimeEventTypes.SessionCheckedIn,
  RealtimeEventTypes.SessionCheckedOut,
  RealtimeEventTypes.ReservationUpdated,
  RealtimeEventTypes.WalletTopUpCompleted,
] as const;

export const mobileDriverRealtimeRefreshEvents = [
  RealtimeEventTypes.SessionCheckedOut,
  RealtimeEventTypes.WalletTopUpCompleted,
] as const;
