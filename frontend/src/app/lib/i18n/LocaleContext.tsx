import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { en } from "./locales/en";
import { vi } from "./locales/vi";

export type Language = "vi" | "en";
export type Currency = "VND" | "USD";

const LANG_KEY = "pbms_lang";
const CURRENCY_KEY = "pbms_currency";
const USD_RATE = 24_000;

type Dict = typeof vi;

const dictionaries: Record<Language, Dict> = { vi, en };

function readStored<T extends string>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const v = localStorage.getItem(key);
  return (v === "vi" || v === "en" || v === "VND" || v === "USD" ? v : fallback) as T;
}

function getNested(obj: Record<string, unknown>, path: string): string | undefined {
  const val = path.split(".").reduce<unknown>((acc, k) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[k];
    return undefined;
  }, obj);
  return typeof val === "string" ? val : undefined;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
}

type LocaleContextValue = {
  language: Language;
  currency: Currency;
  setLanguage: (lang: Language) => void;
  setCurrency: (currency: Currency) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatMoney: (amountVnd: number | null | undefined) => string;
  formatDateTime: (value: string | Date | null | undefined) => string;
  ts: (status: string) => string;
  tp: (method: string) => string;
  tv: (typeCode: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => readStored(LANG_KEY, "vi"));
  const [currency, setCurrencyState] = useState<Currency>(() => readStored(CURRENCY_KEY, "VND"));

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem(CURRENCY_KEY, c);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const dict = dictionaries[language] as unknown as Record<string, unknown>;
      const text = getNested(dict, key) ?? getNested(dictionaries.vi as unknown as Record<string, unknown>, key) ?? key;
      return interpolate(text, params);
    },
    [language],
  );

  const formatMoney = useCallback(
    (amountVnd: number | null | undefined) => {
      const n = Number(amountVnd ?? 0);
      if (currency === "USD") {
        const usd = n / USD_RATE;
        return new Intl.NumberFormat(language === "vi" ? "vi-VN" : "en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 2,
        }).format(usd);
      }
      return new Intl.NumberFormat(language === "vi" ? "vi-VN" : "en-US", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(n);
    },
    [currency, language],
  );

  const formatDateTime = useCallback(
    (value: string | Date | null | undefined) => {
      if (!value) return "-";
      const d = value instanceof Date ? value : new Date(value);
      return d.toLocaleString(language === "vi" ? "vi-VN" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    },
    [language],
  );

  const ts = useCallback(
    (status: string) => {
      const k = `status.${status}`;
      const translated = t(k);
      return translated === k ? status : translated;
    },
    [t],
  );

  const tp = useCallback(
    (method: string) => {
      const k = `payment.${method}`;
      const translated = t(k);
      return translated === k ? method : translated;
    },
    [t],
  );

  const tv = useCallback(
    (typeCode: string) => {
      const k = `vehicleType.${typeCode}`;
      const translated = t(k);
      return translated === k ? typeCode : translated;
    },
    [t],
  );

  const value = useMemo(
    () => ({ language, currency, setLanguage, setCurrency, t, formatMoney, formatDateTime, ts, tp, tv }),
    [language, currency, setLanguage, setCurrency, t, formatMoney, formatDateTime, ts, tp, tv],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
