type ErrorBannerProps = {
  error?: string;
  offline?: boolean;
  offlineMessage?: string;
  className?: string;
};

export function ErrorBanner({ error, offline, offlineMessage, className = "" }: ErrorBannerProps) {
  const message = offline ? offlineMessage : error;
  if (!message) return null;

  return (
    <div
      className={`text-sm text-red-600 bg-red-50 dark:bg-red-500/10 p-3 rounded-xl border border-red-200 dark:border-red-500/20 break-words ${className}`}
    >
      {message}
    </div>
  );
}
