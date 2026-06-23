import { useCallback, useEffect, useState } from "react";
import { Banknote, Check, Plus, Edit2, ShieldAlert, Bike, Car, Star, Loader2, X } from "lucide-react";
import { apiGet, apiPost, apiPut } from "../lib/api";
import { getAuth } from "../lib/auth";
import { useLocale } from "../lib/i18n/LocaleContext";

type PricingPolicy = {
  policyId: number;
  vehicleTypeId: number;
  vehicleTypeCode: string;
  policyName: string;
  pricePerHour: number;
  dailyMaxFee: number | null;
  lostTicketFee: number;
  overtimeFee: number;
  status: string;
};

type VehicleType = { vehicleTypeId: number; typeCode: string; typeName: string };

const ICON_BY_CODE: Record<string, { icon: React.ReactNode; color: string }> = {
  MOTORBIKE: { icon: <Bike className="w-6 h-6" />, color: "blue" },
  CAR: { icon: <Car className="w-6 h-6" />, color: "green" },
  EV: { icon: <Star className="w-6 h-6" />, color: "yellow" },
};

const colorMap: Record<string, { badge: string; icon: string; accent: string }> = {
  blue: { badge: "bg-blue-50 dark:bg-blue-500/10 text-blue-600", icon: "bg-blue-50 dark:bg-blue-500/15 text-blue-500", accent: "text-blue-600" },
  green: { badge: "bg-blue-600/10 text-blue-600", icon: "bg-blue-600/10 text-blue-600", accent: "text-blue-600" },
  yellow: { badge: "bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600", icon: "bg-yellow-50 dark:bg-yellow-500/15 text-yellow-500", accent: "text-yellow-600" },
};

export function PricingPolicies() {
  const { t, formatMoney, ts } = useLocale();
  const [policies, setPolicies] = useState<PricingPolicy[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [configs, setConfigs] = useState<{ configKey: string; configValue: string; description?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<PricingPolicy | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    vehicleTypeId: 1,
    policyName: "",
    pricePerHour: 0,
    dailyMaxFee: 0,
    lostTicketFee: 0,
    overtimeFee: 0,
    status: "Active",
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const auth = getAuth();
    setLoading(true);
    setError("");
    try {
      const [p, vt, cfg] = await Promise.all([
        apiGet<PricingPolicy[]>("/api/pricing-policies", auth?.token),
        apiGet<VehicleType[]>("/api/vehicle-types", auth?.token),
        apiGet<typeof configs>("/api/system-configs", auth?.token).catch(() => []),
      ]);
      setPolicies(p);
      setVehicleTypes(vt);
      setConfigs(cfg);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("pricing.loadFailed"));
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
      vehicleTypeId: vehicleTypes[0]?.vehicleTypeId ?? 1,
      policyName: "",
      pricePerHour: 10000,
      dailyMaxFee: 100000,
      lostTicketFee: 50000,
      overtimeFee: 0,
      status: "Active",
    });
  }

  function openEdit(policy: PricingPolicy) {
    setEditing(policy);
    setCreating(false);
    setForm({
      vehicleTypeId: policy.vehicleTypeId,
      policyName: policy.policyName,
      pricePerHour: policy.pricePerHour,
      dailyMaxFee: policy.dailyMaxFee ?? 0,
      lostTicketFee: policy.lostTicketFee,
      overtimeFee: policy.overtimeFee,
      status: policy.status,
    });
  }

  async function handleSave() {
    const auth = getAuth();
    setSaving(true);
    setError("");
    try {
      const body = {
        policyId: editing?.policyId ?? 0,
        vehicleTypeId: form.vehicleTypeId,
        policyName: form.policyName,
        pricePerHour: form.pricePerHour,
        dailyMaxFee: form.dailyMaxFee || null,
        lostTicketFee: form.lostTicketFee,
        overtimeFee: form.overtimeFee,
        status: form.status,
        createdAt: editing ? undefined : new Date().toISOString(),
      };
      if (editing) {
        await apiPut(`/api/pricing-policies/${editing.policyId}`, body, auth?.token);
      } else {
        await apiPost("/api/pricing-policies", body, auth?.token);
      }
      setEditing(null);
      setCreating(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("pricing.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  const policyRules = configs.filter((c) =>
    ["GRACE_PERIOD_MINUTES", "RESERVATION_HOLD_MINUTES", "MAX_ACTIVE_RESERVATIONS", "DEFAULT_CURRENCY"].includes(c.configKey),
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("pricing.title")}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t("pricing.subtitle")}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600/90 transition-colors shadow-md shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          {t("pricing.addPolicy")}
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
          {policies.map((policy) => {
            const meta = ICON_BY_CODE[policy.vehicleTypeCode] ?? ICON_BY_CODE.CAR;
            const colors = colorMap[meta.color];
            return (
              <div
                key={policy.policyId}
                className="relative bg-white dark:bg-[#1A1A1A] rounded-2xl border-2 border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col shadow-sm"
              >
                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2.5 rounded-xl ${colors.icon}`}>{meta.icon}</div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{policy.policyName}</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{policy.vehicleTypeCode} • {ts(policy.status)}</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col gap-0">
                  {[
                    { label: t("pricing.pricePerHour"), value: formatMoney(policy.pricePerHour) },
                    { label: t("pricing.dailyMax"), value: policy.dailyMaxFee ? formatMoney(policy.dailyMaxFee) : "—" },
                    { label: t("pricing.lostTicketFee"), value: formatMoney(policy.lostTicketFee), accent: true },
                  ].map((item, i, arr) => (
                    <div
                      key={item.label}
                      className={`flex justify-between items-center py-3.5 ${i < arr.length - 1 ? "border-b border-gray-100 dark:border-gray-800" : ""}`}
                    >
                      <span className="text-gray-500 dark:text-gray-400 text-sm">{item.label}</span>
                      <span className={`font-bold text-base ${item.accent ? colors.accent : "text-gray-900 dark:text-white"}`}>{item.value}</span>
                    </div>
                  ))}
                  <button
                    onClick={() => openEdit(policy)}
                    className="mt-5 w-full flex justify-center items-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <Edit2 className="w-4 h-4" /> {t("common.edit")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-[#121212]/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/10 rounded-xl">
              <ShieldAlert className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">{t("pricing.sysRules")}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t("pricing.sysRulesDesc")}</p>
            </div>
          </div>
          <Banknote className="w-5 h-5 text-gray-400" />
        </div>
        <div className="p-6">
          <ul className="space-y-5">
            {policyRules.length > 0 ? policyRules.map((rule) => (
              <li key={rule.configKey} className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-blue-600/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div>
                  <strong className="text-gray-900 dark:text-white block mb-1 text-sm">{rule.configKey}</strong>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{rule.description ?? rule.configValue}</p>
                  <p className="text-blue-600 font-semibold text-sm mt-1">{rule.configValue}</p>
                </div>
              </li>
            )) : (
              <li className="text-gray-500 text-sm">{t("pricing.noRules")}</li>
            )}
          </ul>
        </div>
      </div>

      {(editing || creating) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                {editing ? t("pricing.editPolicy") : t("pricing.addPolicyModal")}
              </h3>
              <button onClick={() => { setEditing(null); setCreating(false); }} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                placeholder={t("pricing.policyName")}
                value={form.policyName}
                onChange={(e) => setForm({ ...form, policyName: e.target.value })}
                className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-[#121212] dark:border-gray-700 dark:text-white"
              />
              {!editing && (
                <select
                  value={form.vehicleTypeId}
                  onChange={(e) => setForm({ ...form, vehicleTypeId: Number(e.target.value) })}
                  className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-[#121212] dark:border-gray-700 dark:text-white"
                >
                  {vehicleTypes.map((vt) => (
                    <option key={vt.vehicleTypeId} value={vt.vehicleTypeId}>{vt.typeName} ({vt.typeCode})</option>
                  ))}
                </select>
              )}
              {[
                { key: "pricePerHour" as const, label: t("pricing.pricePerHour") },
                { key: "dailyMaxFee" as const, label: t("pricing.dailyMax") },
                { key: "lostTicketFee" as const, label: t("pricing.lostTicketFee") },
                { key: "overtimeFee" as const, label: t("pricing.overtimeFee") },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-xs text-gray-500">{f.label}</label>
                  <input
                    type="number"
                    value={form[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: Number(e.target.value) })}
                    className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-[#121212] dark:border-gray-700 dark:text-white"
                  />
                </div>
              ))}
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-[#121212] dark:border-gray-700 dark:text-white"
              >
                <option value="Active">{ts("Active")}</option>
                <option value="Inactive">{ts("Inactive")}</option>
              </select>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !form.policyName}
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
