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
