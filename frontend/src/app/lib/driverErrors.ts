import { formatApiError } from "./api";

type Translator = (key: string) => string;

export function toDriverErrorMessage(
  error: unknown,
  t: Translator,
  fallback: string,
): string {
  return formatApiError(error, {
    network: t("common.networkError"),
    timeout: t("common.timeoutError"),
    fallback,
  });
}

/** Shorthand for admin/manager panels — same i18n network/timeout handling. */
export function apiErrorMessage(t: Translator, fallback: string) {
  return (error: unknown) => toDriverErrorMessage(error, t, fallback);
}
