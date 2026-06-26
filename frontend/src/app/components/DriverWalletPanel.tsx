import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, QrCode, Wallet, X } from "lucide-react";
import { useLocale } from "../lib/i18n/LocaleContext";
import { toDriverErrorMessage } from "../lib/driverErrors";
import {
  createTopUp,
  getTopUp,
  getWallet,
  simulateTopUp,
  type CreateTopUpResponse,
} from "../lib/walletApi";

const PRESET_AMOUNTS = [50_000, 100_000, 200_000, 500_000] as const;

type Props = {
  userId: number;
  authToken: string;
  balance: number;
  onBalanceChange: (balance: number) => void;
  onSuccess?: () => void;
  compact?: boolean;
};

export function DriverWalletPanel({
  userId,
  authToken,
  balance,
  onBalanceChange,
  onSuccess,
  compact = false,
}: Props) {
  const { t, formatMoney } = useLocale();
  const [selectedAmount, setSelectedAmount] = useState<number>(100_000);
  const [customAmount, setCustomAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState<CreateTopUpResponse | null>(null);
  const [simulating, setSimulating] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const effectiveAmount = customAmount.trim()
    ? Number(customAmount.replace(/\D/g, ""))
    : selectedAmount;

  const errMsg = (e: unknown, fallback: string) =>
    toDriverErrorMessage(e, t, fallback);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const refreshBalance = useCallback(async (topUpId: number) => {
    const topUp = await getTopUp(userId, topUpId, authToken);
    if (topUp.status === "Completed") {
      stopPolling();
      setPending(null);
      setMessage(t("driver.wallet.topUpSuccess"));
      onSuccess?.();
      const wallet = await getWallet(userId, authToken);
      onBalanceChange(wallet.balance);
    }
  }, [authToken, onBalanceChange, onSuccess, stopPolling, t, userId]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  useEffect(() => {
    if (!pending) return;
    pollRef.current = setInterval(() => {
      refreshBalance(pending.topUpId).catch(() => {});
    }, 2500);
    return stopPolling;
  }, [pending, refreshBalance, stopPolling]);

  async function handleTopUp() {
    if (!effectiveAmount || effectiveAmount < 10_000) {
      setError(t("driver.wallet.minAmount"));
      return;
    }
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const res = await createTopUp(userId, effectiveAmount, authToken);
      setPending(res);
      if (res.checkoutUrl && !res.demoMode) {
        window.open(res.checkoutUrl, "_blank", "noopener,noreferrer");
      }
      setMessage(t("driver.wallet.scanQr"));
    } catch (e) {
      setError(errMsg(e, t("driver.wallet.topUpFailed")));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSimulate() {
    if (!pending) return;
    setSimulating(true);
    setError("");
    try {
      await simulateTopUp(userId, pending.topUpId, authToken);
      await refreshBalance(pending.topUpId);
    } catch (e) {
      setError(errMsg(e, t("driver.wallet.topUpFailed")));
    } finally {
      setSimulating(false);
    }
  }

  return (
    <div className={compact ? "space-y-4" : "space-y-5"}>
      <div className={`rounded-xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-blue-600 to-blue-700 text-white ${compact ? "p-4" : "p-5"}`}>
        <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
          <Wallet className="w-4 h-4" />
          {t("driver.wallet.balance")}
        </div>
        <p className={`font-bold ${compact ? "text-2xl" : "text-3xl"}`}>{formatMoney(balance)}</p>
        <p className="text-xs text-white/70 mt-2">{t("driver.wallet.payViaPayOS")}</p>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t("driver.wallet.selectAmount")}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRESET_AMOUNTS.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => { setSelectedAmount(amt); setCustomAmount(""); }}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                selectedAmount === amt && !customAmount
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1A1A1A] text-gray-800 dark:text-gray-200"
              }`}
            >
              {formatMoney(amt)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 dark:text-gray-400">{t("driver.wallet.customAmount")}</label>
        <input
          type="text"
          inputMode="numeric"
          placeholder="100000"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value.replace(/\D/g, ""))}
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm dark:bg-[#121212] dark:border-gray-700"
        />
        <p className="text-xs text-gray-400 mt-1">{t("driver.wallet.minAmount")}</p>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-500/10 p-2 rounded-lg">{error}</p>}
      {message && !pending && <p className="text-sm text-blue-600 bg-blue-50 dark:bg-blue-500/10 p-2 rounded-lg">{message}</p>}

      {!pending && (
        <button
          type="button"
          onClick={handleTopUp}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 rounded-lg disabled:opacity-60"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {t("driver.wallet.confirmTopUp")}
        </button>
      )}

      {pending && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A1A1A] p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{t("driver.wallet.pending")}</p>
              <p className="text-sm text-gray-500">{formatMoney(pending.amount)}</p>
            </div>
            <button type="button" onClick={() => { stopPolling(); setPending(null); }} className="p-1 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {pending.qrCode ? (
            <div className="flex justify-center">
              <img
                src={pending.qrCode}
                alt="VietQR"
                className="w-48 h-48 object-contain rounded-lg border border-gray-100 dark:border-gray-800"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          ) : (
            <div className="flex justify-center py-6">
              <QrCode className="w-24 h-24 text-gray-300" />
            </div>
          )}

          <p className="text-center text-sm text-gray-500">{t("driver.wallet.scanQr")}</p>

          {pending.demoMode && (
            <>
              <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-500/10 p-2 rounded-lg">{t("driver.wallet.demoNote")}</p>
              <button
                type="button"
                onClick={handleSimulate}
                disabled={simulating}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-blue-600 text-blue-600 font-semibold py-2.5 rounded-lg disabled:opacity-60"
              >
                {simulating && <Loader2 className="w-4 h-4 animate-spin" />}
                {t("driver.wallet.simulatePayment")}
              </button>
            </>
          )}

          {!pending.demoMode && pending.checkoutUrl && (
            <a
              href={pending.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-sm text-blue-600 font-semibold hover:underline"
            >
              {t("driver.wallet.openPayOS")}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
