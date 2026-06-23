import { apiGet, apiPost } from "./api";

export type WalletTopUpDto = {
  topUpId: number;
  amount: number;
  status: string;
  payOsOrderCode: number;
  checkoutUrl?: string | null;
  qrCode?: string | null;
  demoMode: boolean;
  createdAt: string;
  completedAt?: string | null;
};

export type WalletSummary = {
  balance: number;
  recentTopUps: WalletTopUpDto[];
};

export type CreateTopUpResponse = {
  topUpId: number;
  amount: number;
  status: string;
  checkoutUrl: string;
  qrCode: string;
  demoMode: boolean;
};

export type DriverTransaction = {
  type: "payment" | "topup" | string;
  id: number;
  amount: number;
  paymentMethod: string;
  paymentTime: string;
  status: string;
  ticketCode?: string | null;
  licensePlate?: string | null;
};

export function getWallet(userId: number, token: string) {
  return apiGet<WalletSummary>(`/api/portal/driver/${userId}/wallet`, token);
}

export function createTopUp(userId: number, amount: number, token: string) {
  return apiPost<CreateTopUpResponse>(
    `/api/portal/driver/${userId}/wallet/top-up`,
    { amount },
    token,
  );
}

export function getTopUp(userId: number, topUpId: number, token: string) {
  return apiGet<WalletTopUpDto>(
    `/api/portal/driver/${userId}/wallet/top-ups/${topUpId}`,
    token,
  );
}

export function simulateTopUp(userId: number, topUpId: number, token: string) {
  return apiPost<WalletTopUpDto>(
    `/api/portal/driver/${userId}/wallet/top-ups/${topUpId}/simulate`,
    {},
    token,
  );
}
