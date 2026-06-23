import { Languages, DollarSign } from "lucide-react";
import { useLocale, type Currency, type Language } from "../lib/i18n/LocaleContext";

export function LocaleSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, currency, setLanguage, setCurrency, t } = useLocale();

  return (
    <div className={`flex items-center gap-1 ${compact ? "" : "bg-gray-100 dark:bg-[#121212] p-1 rounded-xl border border-gray-200 dark:border-gray-800"}`}>
      <div className="flex items-center gap-0.5" title={t("locale.language")}>
        {!compact && <Languages className="w-3.5 h-3.5 text-gray-400 ml-1 hidden sm:block" />}
        {(["vi", "en"] as Language[]).map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => setLanguage(lang)}
            className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
              language === lang
                ? "bg-white dark:bg-gray-800 text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            {lang.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5" />
      <div className="flex items-center gap-0.5" title={t("locale.currency")}>
        {!compact && <DollarSign className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />}
        {(["VND", "USD"] as Currency[]).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCurrency(c)}
            className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
              currency === c
                ? "bg-white dark:bg-gray-800 text-green-600 shadow-sm"
                : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
