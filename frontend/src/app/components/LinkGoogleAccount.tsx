import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet, apiPost, formatApiError } from "../lib/api";
import { getAuth } from "../lib/auth";
import { isGoogleSignInConfigured, mountGoogleSignInButton } from "../lib/googleAuth";
import { useLocale } from "../lib/i18n/LocaleContext";

type Providers = { hasLocalPassword: boolean; googleLinked: boolean };

type Props = {
  className?: string;
  compact?: boolean;
};

export function LinkGoogleAccount({ className = "", compact = false }: Props) {
  const { t } = useLocale();
  const auth = getAuth();
  const btnRef = useRef<HTMLDivElement>(null);
  const [providers, setProviders] = useState<Providers | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const loadProviders = useCallback(async () => {
    if (!auth?.token) return;
    setLoading(true);
    setError("");
    try {
      const data = await apiGet<Providers>("/api/auth/providers", auth.token);
      setProviders(data);
    } catch (e) {
      setError(formatApiError(e, {
        network: t("common.networkError"),
        timeout: t("common.timeoutError"),
        fallback: t("settings.googleLinkLoadFailed"),
      }));
    } finally {
      setLoading(false);
    }
  }, [auth?.token, t]);

  useEffect(() => {
    void loadProviders();
  }, [loadProviders]);

  useEffect(() => {
    if (!providers || providers.googleLinked || !isGoogleSignInConfigured() || !btnRef.current || !auth?.token) {
      return;
    }

    let cancelled = false;
    void mountGoogleSignInButton(
      btnRef.current,
      async (idToken) => {
        if (cancelled) return;
        setError("");
        setSuccess("");
        try {
          await apiPost("/api/auth/link-google", { idToken }, auth.token);
          setSuccess(t("settings.googleLinkSuccess"));
          await loadProviders();
        } catch (e) {
          setError(formatApiError(e, {
            network: t("common.networkError"),
            timeout: t("common.timeoutError"),
            fallback: t("settings.googleLinkFailed"),
          }));
        }
      },
      () => {
        if (!cancelled) setError(t("auth.loginGoogleFailed"));
      },
    );

    return () => {
      cancelled = true;
    };
  }, [providers, auth?.token, loadProviders, t]);

  if (!auth?.token) return null;
  if (auth.roleName.toLowerCase() !== "driver") return null;

  return (
    <div className={className}>
      {!compact && (
        <>
          <h3 className="font-semibold text-gray-900 dark:text-white">{t("settings.googleLinkTitle")}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 mt-1">{t("settings.googleLinkDesc")}</p>
        </>
      )}
      {loading && <p className="text-xs text-gray-400">{t("common.loading")}</p>}
      {!loading && providers?.googleLinked && (
        <p className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 inline-block px-2 py-1 rounded">
          {t("settings.googleLinked")}
        </p>
      )}
      {!loading && providers && !providers.googleLinked && (
        <>
          {compact && <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t("settings.googleLinkDesc")}</p>}
          {isGoogleSignInConfigured() ? (
            <div ref={btnRef} className="w-full flex justify-start min-h-[40px]" />
          ) : (
            <p className="text-xs text-orange-500">{t("auth.loginGoogleNotConfigured")}</p>
          )}
        </>
      )}
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      {success && <p className="text-xs text-green-600 mt-2">{success}</p>}
    </div>
  );
}
