import { useNavigate } from "react-router";
import { useLocale } from "../lib/i18n/LocaleContext";

export function RouteErrorPage() {
  const navigate = useNavigate();
  const { t } = useLocale();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white">
      <h1 className="text-4xl font-bold mb-4 text-[#00C853]">{t("common.oops")}</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">{t("common.pageError")}</p>
      <button
        type="button"
        onClick={() => navigate("/login")}
        className="px-4 py-2 bg-[#00C853] text-white rounded-lg font-medium hover:bg-[#00C853]/90 transition-colors"
      >
        {t("common.backToLogin")}
      </button>
    </div>
  );
}
