import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useLocale } from "../lib/i18n/LocaleContext";
import { toDriverErrorMessage } from "../lib/driverErrors";
import {
  getSubscriptionPlans,
  getMySubscriptions,
  buySubscription,
  cancelSubscription,
  type SubscriptionPlan,
  type Subscription,
} from "../lib/subscriptionApi";

type Props = {
  userId: number;
  authToken: string;
  onSuccess?: () => void;
};

export function DriverSubscriptionPanel({ userId, authToken, onSuccess }: Props) {
  const { t, formatMoney, formatDateTime, ts } = useLocale();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [licensePlate, setLicensePlate] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const errMsg = useCallback((e: unknown, fallback: string) => toDriverErrorMessage(e, t, fallback), [t]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([
        getSubscriptionPlans(authToken),
        getMySubscriptions(userId, authToken),
      ]);
      setPlans(p);
      setSubscriptions(s);
      setSelectedPlanId((prev) => prev ?? p[0]?.planId ?? null);
    } catch (e) {
      setError(errMsg(e, t("driver.subscription.buyFailed")));
    } finally {
      setLoading(false);
    }
  }, [authToken, userId, errMsg, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleBuy() {
    if (!selectedPlanId || !licensePlate.trim()) return;
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      await buySubscription(selectedPlanId, licensePlate.trim(), authToken);
      setMessage(t("driver.subscription.buySuccess"));
      setLicensePlate("");
      await load();
      onSuccess?.();
    } catch (e) {
      setError(errMsg(e, t("driver.subscription.buyFailed")));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(subscriptionId: number) {
    setSubmitting(true);
    setError("");
    try {
      await cancelSubscription(subscriptionId, authToken);
      setMessage(t("driver.subscription.cancelSuccess"));
      await load();
    } catch (e) {
      setError(errMsg(e, t("driver.subscription.cancelFailed")));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t("driver.subscription.choosePlan")}</p>
        <div className="space-y-2">
          {plans.map((plan) => (
            <button
              key={plan.planId}
              type="button"
              onClick={() => setSelectedPlanId(plan.planId)}
              className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
                selectedPlanId === plan.planId
                  ? "border-blue-600 bg-blue-600/5"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1A1A1A]"
              }`}
            >
              <div className="flex justify-between items-center gap-3">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{plan.planName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {plan.vehicleTypeCode} • {t("driver.subscription.durationDays", { days: plan.durationDays })} • {plan.zoneCode ?? t("driver.subscription.allZones")}
                  </p>
                </div>
                <p className="font-bold text-blue-600 text-sm shrink-0">{formatMoney(plan.price)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 dark:text-gray-400">{t("driver.subscription.plateLabel")}</label>
        <input
          type="text"
          placeholder={t("driver.subscription.platePlaceholder")}
          value={licensePlate}
          onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm dark:bg-[#121212] dark:border-gray-700"
        />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-500/10 p-2 rounded-lg">{error}</p>}
      {message && <p className="text-sm text-blue-600 bg-blue-50 dark:bg-blue-500/10 p-2 rounded-lg">{message}</p>}

      <button
        type="button"
        onClick={handleBuy}
        disabled={submitting || !selectedPlanId || !licensePlate.trim()}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 rounded-lg disabled:opacity-60"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {t("driver.subscription.buy")}
      </button>

      <div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t("driver.subscription.myActive")}</p>
        {subscriptions.length === 0 ? (
          <p className="text-sm text-gray-400">{t("driver.subscription.noActive")}</p>
        ) : (
          <div className="space-y-2">
            {subscriptions.map((sub) => (
              <div key={sub.subscriptionId} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A1A1A] p-3">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm font-mono">{sub.licensePlate}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{sub.planName}</p>
                    <p className="text-xs text-gray-400 mt-1">{t("driver.subscription.expiresOn", { date: formatDateTime(sub.endDate) })}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg shrink-0 ${sub.isActive ? "text-blue-600 bg-blue-600/10" : "text-gray-500 bg-gray-100 dark:bg-gray-800"}`}>
                    {ts(sub.status)}
                  </span>
                </div>
                {sub.isActive && (
                  <button
                    type="button"
                    onClick={() => handleCancel(sub.subscriptionId)}
                    disabled={submitting}
                    className="mt-2 text-xs text-red-600 font-semibold hover:underline disabled:opacity-60"
                  >
                    {t("driver.subscription.cancel")}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
