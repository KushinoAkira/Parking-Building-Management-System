import { apiGet, apiPost, apiPut } from "./api";

export type SubscriptionPlan = {
  planId: number;
  planName: string;
  vehicleTypeId: number;
  vehicleTypeCode: string;
  zoneId?: number | null;
  zoneCode?: string | null;
  durationDays: number;
  price: number;
  status: string;
  createdAt: string;
};

export type Subscription = {
  subscriptionId: number;
  userId: number;
  planId: number;
  planName: string;
  vehicleTypeId: number;
  vehicleTypeCode: string;
  zoneId?: number | null;
  zoneCode?: string | null;
  licensePlate: string;
  startDate: string;
  endDate: string;
  pricePaid: number;
  status: string;
  isActive: boolean;
  createdAt: string;
};

export function getSubscriptionPlans(token: string, includeInactive = false) {
  return apiGet<SubscriptionPlan[]>(
    `/api/subscription-plans${includeInactive ? "?includeInactive=true" : ""}`,
    token,
  );
}

export function createSubscriptionPlan(
  request: { planName: string; vehicleTypeId: number; zoneId: number | null; durationDays: number; price: number },
  token: string,
) {
  return apiPost<SubscriptionPlan>("/api/subscription-plans", request, token);
}

export function updateSubscriptionPlan(
  planId: number,
  request: { planName: string; durationDays: number; price: number; status: string },
  token: string,
) {
  return apiPut<SubscriptionPlan>(`/api/subscription-plans/${planId}`, request, token);
}

export function getMySubscriptions(userId: number, token: string) {
  return apiGet<Subscription[]>(`/api/subscriptions?userId=${userId}`, token);
}

export function buySubscription(planId: number, licensePlate: string, token: string) {
  return apiPost<Subscription>("/api/subscriptions/buy", { planId, licensePlate }, token);
}

export function cancelSubscription(subscriptionId: number, token: string) {
  return apiPost<Subscription>(`/api/subscriptions/${subscriptionId}/cancel`, {}, token);
}
