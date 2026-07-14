import { useCallback, useEffect, useState } from "react";
import { Tag, Plus, Edit2, Loader2, X } from "lucide-react";
import { apiGet } from "../lib/api";
import { getAuth } from "../lib/auth";
import { useLocale } from "../lib/i18n/LocaleContext";
import { apiErrorMessage } from "../lib/driverErrors";
import {
  getSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  type SubscriptionPlan,
} from "../lib/subscriptionApi";
import { type BookVehicleType, type BookZone, bookableVehicleTypes, zonesForVehicleType } from "../lib/bookZones";

export function SubscriptionPlans() {
  const { t, formatMoney, ts } = useLocale();
  const errMsg = apiErrorMessage(t, t("subscriptionPlans.saveFailed"));

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<BookVehicleType[]>([]);
  const [zones, setZones] = useState<BookZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    planName: "",
    vehicleTypeId: 1,
    zoneId: 0,
    durationDays: 30,
    price: 300000,
    status: "Active",
  });

  const load = useCallback(async () => {
    const auth = getAuth();
    setLoading(true);
    setError("");
    try {
      const [p, vt, z] = await Promise.all([
        getSubscriptionPlans(auth?.token ?? "", true),
        apiGet<BookVehicleType[]>("/api/vehicle-types", auth?.token),
        apiGet<BookZone[]>("/api/zones?status=Active", auth?.token),
      ]);
      setPlans(p);
      setVehicleTypes(bookableVehicleTypes(vt));
      setZones(z);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setCreating(true);
    setEditing(null);
    setForm({
      planName: "",
      vehicleTypeId: vehicleTypes[0]?.vehicleTypeId ?? 1,
      zoneId: 0,
      durationDays: 30,
      price: 300000,
      status: "Active",
    });
  }

  function openEdit(plan: SubscriptionPlan) {
    setEditing(plan);
    setCreating(false);
    setForm({
      planName: plan.planName,
      vehicleTypeId: plan.vehicleTypeId,
      zoneId: plan.zoneId ?? 0,
      durationDays: plan.durationDays,
      price: plan.price,
      status: plan.status,
    });
  }

  async function handleSave() {
    const auth = getAuth();
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await updateSubscriptionPlan(
          editing.planId,
          { planName: form.planName, durationDays: form.durationDays, price: form.price, status: form.status },
          auth?.token ?? "",
        );
      } else {
        await createSubscriptionPlan(
          {
            planName: form.planName,
            vehicleTypeId: form.vehicleTypeId,
            zoneId: form.zoneId || null,
            durationDays: form.durationDays,
            price: form.price,
          },
          auth?.token ?? "",
        );
      }
      setEditing(null);
      setCreating(false);
      await load();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setSaving(false);
    }
  }

  const zoneOptions = zonesForVehicleType(zones, form.vehicleTypeId);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("subscriptionPlans.title")}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t("subscriptionPlans.subtitle")}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600/90 transition-colors shadow-md shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          {t("subscriptionPlans.addPlan")}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 text-sm border border-red-200 dark:border-red-500/20">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.planId}
              className="relative bg-white dark:bg-[#1A1A1A] rounded-2xl border-2 border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col shadow-sm"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-500">
                    <Tag className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.planName}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                      {plan.vehicleTypeCode} • {ts(plan.status)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col gap-0">
                {[
                  { label: t("subscriptionPlans.price"), value: formatMoney(plan.price) },
                  { label: t("subscriptionPlans.durationDays"), value: t("driver.subscription.durationDays", { days: plan.durationDays }) },
                  { label: t("subscriptionPlans.zone"), value: plan.zoneCode ?? t("subscriptionPlans.allZones") },
                ].map((item, i, arr) => (
                  <div
                    key={item.label}
                    className={`flex justify-between items-center py-3.5 ${i < arr.length - 1 ? "border-b border-gray-100 dark:border-gray-800" : ""}`}
                  >
                    <span className="text-gray-500 dark:text-gray-400 text-sm">{item.label}</span>
                    <span className="font-bold text-base text-gray-900 dark:text-white">{item.value}</span>
                  </div>
                ))}
                <button
                  onClick={() => openEdit(plan)}
                  className="mt-5 w-full flex justify-center items-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Edit2 className="w-4 h-4" /> {t("common.edit")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(editing || creating) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                {editing ? t("subscriptionPlans.editPlan") : t("subscriptionPlans.addPlanModal")}
              </h3>
              <button onClick={() => { setEditing(null); setCreating(false); }} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                placeholder={t("subscriptionPlans.planName")}
                value={form.planName}
                onChange={(e) => setForm({ ...form, planName: e.target.value })}
                className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-[#121212] dark:border-gray-700 dark:text-white"
              />
              {!editing && (
                <>
                  <select
                    value={form.vehicleTypeId}
                    onChange={(e) => setForm({ ...form, vehicleTypeId: Number(e.target.value), zoneId: 0 })}
                    className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-[#121212] dark:border-gray-700 dark:text-white"
                  >
                    {vehicleTypes.map((vt) => (
                      <option key={vt.vehicleTypeId} value={vt.vehicleTypeId}>{vt.typeName} ({vt.typeCode})</option>
                    ))}
                  </select>
                  <select
                    value={form.zoneId}
                    onChange={(e) => setForm({ ...form, zoneId: Number(e.target.value) })}
                    className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-[#121212] dark:border-gray-700 dark:text-white"
                  >
                    <option value={0}>{t("subscriptionPlans.allZones")}</option>
                    {zoneOptions.map((z) => (
                      <option key={z.zoneId} value={z.zoneId}>{z.zoneCode}</option>
                    ))}
                  </select>
                </>
              )}
              <div>
                <label className="text-xs text-gray-500">{t("subscriptionPlans.durationDays")}</label>
                <input
                  type="number"
                  value={form.durationDays}
                  onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })}
                  className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-[#121212] dark:border-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">{t("subscriptionPlans.price")}</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-[#121212] dark:border-gray-700 dark:text-white"
                />
              </div>
              {editing && (
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-[#121212] dark:border-gray-700 dark:text-white"
                >
                  <option value="Active">{ts("Active")}</option>
                  <option value="Inactive">{ts("Inactive")}</option>
                </select>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !form.planName}
              className="mt-4 w-full bg-blue-600 text-white py-2.5 rounded-xl font-bold disabled:opacity-60 flex justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {t("common.save")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
