import { useCallback, useEffect, useMemo, useState } from "react";
import { Car, Home, Ticket, History, LogOut, Calendar, MessageSquare, XCircle, Wallet } from "lucide-react";
import { useNavigate } from "react-router";
import { apiGet, apiPost, isNetworkError, isTimeoutError } from "../lib/api";
import { clearAuth, getAuth } from "../lib/auth";
import { stopRealtimeConnection } from "../lib/realtime";
import { useLocale } from "../lib/i18n/LocaleContext";
import { DriverWalletPanel } from "./DriverWalletPanel";
import type { DriverTransaction } from "../lib/walletApi";
import {
  type BookVehicleType,
  type BookZone,
} from "../lib/bookZones";
import { toDriverErrorMessage } from "../lib/driverErrors";
import { driverRealtimeRefreshEvents } from "../lib/driverRealtime";
import { createAndConfirmReservation } from "../lib/bookReservation";
import { useStableLoader } from "../lib/hooks/useStableLoader";
import { useBookingForm } from "../lib/hooks/useBookingForm";
import { useFeedbackForm } from "../lib/hooks/useFeedbackForm";
import { TAB_ACTIVE, TAB_INACTIVE, SECTION_CARD } from "../lib/uiClasses";
import { ErrorBanner } from "./ErrorBanner";
import { LinkGoogleAccount } from "./LinkGoogleAccount";

type ReservationRow = {
  reservationId: number;
  licensePlate: string;
  zoneCode: string | null;
  slotId: string | null;
  reservedFrom: string;
  reservedTo: string;
  status: string;
  preferVipSlot?: boolean;
  vipSurcharge?: number | null;
  isVipSlot?: boolean;
};

const PAYMENT_METHODS = ["Cash", "BankTransfer", "EWallet"] as const;

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function UserWebDashboard() {
  const navigate = useNavigate();
  const { t, formatMoney, formatDateTime, ts, tp, tv } = useLocale();
  const auth = getAuth();
  const authToken = auth?.token ?? "";
  const authRole = auth?.roleName?.toLowerCase() ?? "";
  const userId = auth?.userId ?? 0;
  const [tab, setTab] = useState<"home" | "tickets" | "history" | "wallet" | "book" | "reservations" | "feedback">("home");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [apiOffline, setApiOffline] = useState(false);
  const [message, setMessage] = useState("");
  const [home, setHome] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<DriverTransaction[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<BookVehicleType[]>([]);
  const [zones, setZones] = useState<BookZone[]>([]);
  const [bookFrom, setBookFrom] = useState("");
  const [bookTo, setBookTo] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_METHODS)[number]>("EWallet");
  const [currentFee, setCurrentFee] = useState<number | null>(null);

  const {
    bookPlate,
    setBookPlate,
    bookVehicleTypeId,
    setBookVehicleTypeId,
    bookZoneId,
    setBookZoneId,
    bookPreferVip,
    setBookPreferVip,
    vipSurchargeAmount,
    setVipSurchargeAmount,
    bookingVehicleTypes,
    bookingZones,
  } = useBookingForm(vehicleTypes, zones);

  const driverError = (e: unknown, fallback: string) => toDriverErrorMessage(e, t, fallback);

  async function loadFeeEstimate(sessionId: number) {
    if (!authToken) return;
    try {
      const fee = await apiGet<{ totalFee: number }>(
        `/api/parking-sessions/${sessionId}/estimate-fee`,
        authToken,
      );
      setCurrentFee(fee.totalFee);
    } catch {
      setCurrentFee(null);
    }
  }

  const loadAll = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!authToken || !userId) return;
    try {
      const h = await apiGet(`/api/portal/driver/${userId}/home`, authToken);
      setHome(h);
      setWalletBalance((h as { user?: { walletBalance?: number } })?.user?.walletBalance ?? 0);
      setApiOffline(false);
      if (!opts?.quiet) setError("");
      const plate = (h as { activeSession?: { licensePlate?: string } })?.activeSession?.licensePlate;
      if (plate) setBookPlate((prev) => prev || plate);
      const active = (h as { activeSession?: { sessionId?: number } })?.activeSession;
      if (active?.sessionId) await loadFeeEstimate(active.sessionId);
      else setCurrentFee(null);
    } catch (e) {
      if (!opts?.quiet) {
        if (isNetworkError(e) || isTimeoutError(e)) setApiOffline(true);
        else setError(driverError(e, t("driver.loadFailed")));
      }
      return;
    }
    const [ticketsRes, txRes, vtRes, zonesRes, resRes, vipRes] = await Promise.allSettled([
      apiGet(`/api/portal/driver/${userId}/tickets`, authToken),
      apiGet(`/api/portal/driver/${userId}/transactions`, authToken),
      apiGet("/api/vehicle-types", authToken),
      apiGet("/api/zones?status=Active", authToken),
      apiGet<ReservationRow[]>(`/api/reservations?userId=${userId}`, authToken),
      apiGet<{ amount: number }>("/api/reservations/vip-surcharge", authToken),
    ]);
    if (ticketsRes.status === "fulfilled") setTickets(ticketsRes.value as any[]);
    if (txRes.status === "fulfilled") setTransactions(txRes.value as DriverTransaction[]);
    if (vtRes.status === "fulfilled") setVehicleTypes(vtRes.value as BookVehicleType[]);
    if (zonesRes.status === "fulfilled") setZones(zonesRes.value as BookZone[]);
    if (resRes.status === "fulfilled") setReservations(resRes.value);
    if (vipRes.status === "fulfilled" && typeof vipRes.value?.amount === "number") {
      setVipSurchargeAmount(vipRes.value.amount);
    }
  }, [authToken, userId, t, setBookPlate, setVipSurchargeAmount]);

  const { reload, reloadQuiet } = useStableLoader(loadAll, driverRealtimeRefreshEvents);

  useEffect(() => {
    const from = new Date();
    from.setHours(from.getHours() + 1, 0, 0, 0);
    const to = new Date(from);
    to.setHours(to.getHours() + 2);
    setBookFrom(toLocalInputValue(from));
    setBookTo(toLocalInputValue(to));
  }, []);

  useEffect(() => {
    if (!authToken || authRole !== "driver") {
      navigate("/login");
      return;
    }
    setLoading(true);
    reload()
      .catch((e) => {
        if (isNetworkError(e) || isTimeoutError(e)) setApiOffline(true);
        else setError(driverError(e, t("driver.loadFailed")));
      })
      .finally(() => setLoading(false));
  }, [navigate, authToken, authRole, t, reload]);

  const activeSession = home?.activeSession;
  const feedback = useFeedbackForm(activeSession?.sessionId);

  const completedTickets = useMemo(
    () => tickets.filter((t) => t.status === "Completed"),
    [tickets],
  );

  async function handleCheckout() {
    if (!activeSession || !authToken) return;
    try {
      await apiPost(
        `/api/parking-sessions/${activeSession.sessionId}/check-out`,
        { paymentMethod, exitGate: "Driver-Web" },
        authToken,
      );
      setMessage(t("driver.checkoutSuccess"));
      await reloadQuiet();
    } catch (e) {
      setError(driverError(e, t("driver.checkoutFailed")));
    }
  }

  async function handleBook() {
    if (!authToken || !userId || !bookPlate.trim() || !bookFrom || !bookTo) {
      setMessage(t("driver.bookValidation"));
      return;
    }
    setMessage("");
    try {
      await createAndConfirmReservation(
        {
          userId,
          vehicleTypeId: bookVehicleTypeId,
          zoneId: bookZoneId || null,
          slotId: null,
          licensePlate: bookPlate.trim(),
          reservedFrom: new Date(bookFrom).toISOString(),
          reservedTo: new Date(bookTo).toISOString(),
          preferVipSlot: bookPreferVip,
        },
        authToken,
      );
      setMessage(t("driver.bookSuccess"));
      await reloadQuiet();
    } catch (e) {
      setMessage(driverError(e, t("driver.bookFailed")));
    }
  }

  async function handleCancelReservation(id: number) {
    if (!authToken) return;
    try {
      await apiPost(`/api/reservations/${id}/cancel`, {}, authToken);
      setMessage(t("driver.cancelSuccess"));
      await reloadQuiet();
    } catch (e) {
      setError(driverError(e, t("driver.cancelFailed")));
    }
  }

  async function handleFeedback() {
    if (!authToken || !userId) return;
    await feedback.submit(authToken, userId, t);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212]">
      <header className="h-16 bg-white dark:bg-[#1A1A1A] border-b border-gray-200 dark:border-gray-800 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Car className="w-5 h-5 text-blue-600" />
          <h1 className="font-semibold text-gray-900 dark:text-white">{t("driver.portal")}</h1>
        </div>
        <button
          onClick={() => { clearAuth(); void stopRealtimeConnection(); navigate("/login"); }}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          title={t("common.logout")}
        >
          <LogOut className="w-5 h-5 text-gray-500" />
        </button>
      </header>

      <main className="p-6 space-y-5">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "home", label: t("driver.home"), icon: <Home className="w-4 h-4 inline mr-1" /> },
            { id: "tickets", label: t("driver.tickets"), icon: <Ticket className="w-4 h-4 inline mr-1" /> },
            { id: "history", label: t("driver.transactions"), icon: <History className="w-4 h-4 inline mr-1" /> },
            { id: "wallet", label: t("driver.walletTab"), icon: <Wallet className="w-4 h-4 inline mr-1" /> },
            { id: "book", label: t("driver.book"), icon: <Calendar className="w-4 h-4 inline mr-1" /> },
            { id: "reservations", label: t("driver.reservations"), icon: <Calendar className="w-4 h-4 inline mr-1" /> },
            { id: "feedback", label: t("driver.feedback"), icon: <MessageSquare className="w-4 h-4 inline mr-1" /> },
          ].map((x) => (
            <button
              key={x.id}
              onClick={() => { setTab(x.id as any); setMessage(""); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === x.id ? TAB_ACTIVE : TAB_INACTIVE}`}
            >
              {x.icon}
              {x.label}
            </button>
          ))}
        </div>

        {loading && <div className="text-sm text-gray-500">{t("driver.loading")}</div>}
        <ErrorBanner offline={apiOffline && !home} offlineMessage={t("common.networkError")} />
        <ErrorBanner error={error} />
        {message && <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">{message}</div>}

        {!loading && tab === "home" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className={SECTION_CARD}>
              <h2 className="font-semibold mb-3">{t("driver.accountInfo")}</h2>
              <p className="text-sm">{t("auth.fullName")}: <strong>{home?.user?.fullName ?? "-"}</strong></p>
              <p className="text-sm">{t("auth.email")}: <strong>{home?.user?.email ?? "-"}</strong></p>
              <p className="text-sm">{t("settings.phone")}: <strong>{home?.user?.phone ?? "-"}</strong></p>
              <p className="text-sm">{t("driver.wallet.balance")}: <strong className="text-blue-600">{formatMoney(walletBalance)}</strong></p>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <LinkGoogleAccount />
              </div>
            </section>

            <section className={SECTION_CARD}>
              <h2 className="font-semibold mb-3">{t("driver.currentSession")}</h2>
              {activeSession ? (
                <>
                  <p className="text-sm">{t("common.plate")}: <strong>{activeSession.licensePlate}</strong></p>
                  <p className="text-sm">{t("common.ticket")}: <strong>{activeSession.ticketCode}</strong></p>
                  <p className="text-sm">{t("history.position")}: <strong>{activeSession.zoneCode} - {activeSession.slotId}</strong></p>
                  <p className="text-sm">{t("history.entryTime")}: <strong>{formatDateTime(activeSession.entryTime)}</strong></p>
                  <p className="text-sm">{t("driver.estimatedFee")}: <strong>{currentFee != null ? formatMoney(currentFee) : t("driver.feeCalculating")}</strong></p>
                  {paymentMethod === "EWallet" && currentFee != null && walletBalance < currentFee && (
                    <p className="text-xs text-amber-600 mt-1">{t("driver.insufficientBalance")}</p>
                  )}
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                    className="mt-3 w-full border rounded-lg px-3 py-2 text-sm dark:bg-[#121212] dark:border-gray-700"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{tp(m)}</option>
                    ))}
                  </select>
                  <button onClick={handleCheckout} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg w-full">
                    {t("driver.checkout")}
                  </button>
                </>
              ) : (
                <p className="text-sm text-gray-500">{t("driver.noSession")}</p>
              )}
            </section>
          </div>
        )}

        {!loading && tab === "tickets" && (
          <section className={SECTION_CARD}>
            <h2 className="font-semibold mb-3">{t("driver.allTickets")}</h2>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200 dark:border-gray-800">
                    <th className="py-2">{t("common.ticket")}</th>
                    <th className="py-2">{t("common.plate")}</th>
                    <th className="py-2">{t("common.slot")}</th>
                    <th className="py-2">{t("common.status")}</th>
                    <th className="py-2">{t("common.fee")}</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.sessionId} className="border-b border-gray-100 dark:border-gray-900">
                      <td className="py-2">{ticket.ticketCode}</td>
                      <td className="py-2 font-mono">{ticket.licensePlate}</td>
                      <td className="py-2">{ticket.zoneCode} - {ticket.slotId}</td>
                      <td className="py-2">{ts(ticket.status)}</td>
                      <td className="py-2">{ticket.totalFee ? formatMoney(ticket.totalFee) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {!loading && tab === "history" && (
          <section className={SECTION_CARD}>
            <h2 className="font-semibold mb-3">{t("driver.txHistory")}</h2>
            <p className="text-sm text-gray-500 mb-2">{t("driver.completedCount", { count: completedTickets.length })}</p>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200 dark:border-gray-800">
                    <th className="py-2">ID</th>
                    <th className="py-2">{t("driver.txType")}</th>
                    <th className="py-2">{t("common.ticket")}</th>
                    <th className="py-2">{t("driver.amount")}</th>
                    <th className="py-2">{t("driver.method")}</th>
                    <th className="py-2">{t("common.time")}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={`${tx.type}-${tx.id}`} className="border-b border-gray-100 dark:border-gray-900">
                      <td className="py-2">{tx.id}</td>
                      <td className="py-2">{tx.type === "topup" ? t("driver.txFilterTopUp") : t("driver.txFilterPayment")}</td>
                      <td className="py-2">{tx.ticketCode ?? "-"}</td>
                      <td className={`py-2 font-semibold ${tx.type === "topup" ? "text-green-600" : ""}`}>
                        {tx.type === "topup" ? `+${formatMoney(tx.amount)}` : formatMoney(tx.amount)}
                      </td>
                      <td className="py-2">{tp(tx.paymentMethod)}</td>
                      <td className="py-2">{formatDateTime(tx.paymentTime)}</td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-gray-400">{t("common.noData")}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {!loading && tab === "wallet" && (
          <section className="bg-white dark:bg-[#1A1A1A] rounded-xl p-5 border border-gray-200 dark:border-gray-800 max-w-xl">
            <h2 className="font-semibold mb-4">{t("driver.wallet.topUpTitle")}</h2>
            <DriverWalletPanel
              userId={userId}
              authToken={authToken}
              balance={walletBalance}
              onBalanceChange={setWalletBalance}
              onSuccess={() => reloadQuiet().catch(() => {})}
            />
          </section>
        )}

        {!loading && tab === "book" && (
          <section className="bg-white dark:bg-[#1A1A1A] rounded-xl p-5 border border-gray-200 dark:border-gray-800 max-w-lg space-y-3">
            <h2 className="font-semibold mb-1">{t("driver.bookTitle")}</h2>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-[#121212] dark:border-gray-700"
              placeholder={t("common.plate")}
              value={bookPlate}
              onChange={(e) => setBookPlate(e.target.value.toUpperCase())}
            />
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-[#121212] dark:border-gray-700"
              value={bookVehicleTypeId}
              onChange={(e) => setBookVehicleTypeId(Number(e.target.value))}
            >
              {bookingVehicleTypes.map((vt) => (
                <option key={vt.vehicleTypeId} value={vt.vehicleTypeId}>
                  {tv(vt.typeCode)}
                </option>
              ))}
            </select>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-[#121212] dark:border-gray-700"
              value={bookZoneId}
              onChange={(e) => setBookZoneId(e.target.value ? Number(e.target.value) : "")}
              disabled={bookingZones.length === 0}
            >
              <option value="">{t("driver.autoZone")}</option>
              {bookingZones.map((z) => (
                <option key={z.zoneId} value={z.zoneId}>
                  {z.zoneName ?? z.zoneCode}
                  {z.availableSlots != null ? ` (${t("driver.freeCount", { count: z.availableSlots })})` : ""}
                </option>
              ))}
            </select>
            {bookingZones.length === 0 && (
              <p className="text-xs text-amber-600">{t("driver.noZonesForVehicle")}</p>
            )}
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={bookPreferVip}
                onChange={(e) => setBookPreferVip(e.target.checked)}
                className="mt-0.5 rounded border-gray-300"
              />
              <span>
                <span className="font-medium">{t("driver.preferVipSlot")}</span>
                {bookPreferVip && (
                  <span className="block text-xs text-amber-600 mt-0.5">
                    {t("driver.vipSurchargeNote", { fee: formatMoney(vipSurchargeAmount) })}
                  </span>
                )}
              </span>
            </label>
            <label className="text-xs text-gray-500">{t("driver.from")}</label>
            <input
              type="datetime-local"
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-[#121212] dark:border-gray-700"
              value={bookFrom}
              onChange={(e) => setBookFrom(e.target.value)}
            />
            <label className="text-xs text-gray-500">{t("driver.to")}</label>
            <input
              type="datetime-local"
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-[#121212] dark:border-gray-700"
              value={bookTo}
              onChange={(e) => setBookTo(e.target.value)}
            />
            <button onClick={handleBook} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold w-full">
              {t("driver.confirmBook")}
            </button>
          </section>
        )}

        {!loading && tab === "reservations" && (
          <section className={SECTION_CARD}>
            <h2 className="font-semibold mb-3">{t("driver.yourReservations")}</h2>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200 dark:border-gray-800">
                    <th className="py-2">{t("common.plate")}</th>
                    <th className="py-2">{t("staff.zoneSlot")}</th>
                    <th className="py-2">{t("driver.from")}</th>
                    <th className="py-2">{t("driver.to")}</th>
                    <th className="py-2">{t("common.status")}</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((r) => (
                    <tr key={r.reservationId} className="border-b border-gray-100 dark:border-gray-900">
                      <td className="py-2 font-mono">{r.licensePlate}</td>
                      <td className="py-2">
                        {r.zoneCode ?? t("driver.autoZone")} {r.slotId ? `- ${r.slotId}` : ""}
                        {(r.isVipSlot || r.preferVipSlot) && (
                          <span className="ml-1 text-xs font-semibold text-amber-600">VIP</span>
                        )}
                        {r.vipSurcharge != null && r.vipSurcharge > 0 && (
                          <span className="block text-xs text-gray-500">+{formatMoney(r.vipSurcharge)}</span>
                        )}
                      </td>
                      <td className="py-2">{formatDateTime(r.reservedFrom)}</td>
                      <td className="py-2">{formatDateTime(r.reservedTo)}</td>
                      <td className="py-2">{ts(r.status)}</td>
                      <td className="py-2">
                        {(r.status === "Confirmed" || r.status === "Pending") && (
                          <button
                            onClick={() => handleCancelReservation(r.reservationId)}
                            className="text-red-600 hover:underline flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" /> {t("driver.cancel")}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {reservations.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-gray-400">{t("driver.noReservations")}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {!loading && tab === "feedback" && (
          <section className="bg-white dark:bg-[#1A1A1A] rounded-xl p-5 border border-gray-200 dark:border-gray-800 max-w-lg space-y-3">
            <h2 className="font-semibold mb-1">{t("driver.sendFeedback")}</h2>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-[#121212] dark:border-gray-700"
              value={feedback.feedbackType}
              onChange={(e) => feedback.setFeedbackType(e.target.value)}
            >
              <option value="Suggestion">{t("driver.suggestion")}</option>
              <option value="Complaint">{t("driver.complaint")}</option>
              <option value="Praise">{t("driver.praise")}</option>
            </select>
            <textarea
              rows={4}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-[#121212] dark:border-gray-700"
              placeholder={t("driver.content")}
              value={feedback.feedbackContent}
              onChange={(e) => feedback.setFeedbackContent(e.target.value)}
            />
            {feedback.message && <p className="text-sm text-blue-600">{feedback.message}</p>}
            <button
              onClick={handleFeedback}
              disabled={feedback.submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-60"
            >
              {t("driver.submitFeedback")}
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
