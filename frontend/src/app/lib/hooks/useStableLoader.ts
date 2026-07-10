import { useCallback, useRef } from "react";
import { useRealtimeRefresh } from "../RealtimeContext";

type LoadOpts = { quiet?: boolean };

export function useStableLoader(
  loader: (opts?: LoadOpts) => Promise<void>,
  realtimeEvents: readonly string[] = [],
) {
  const ref = useRef(loader);
  ref.current = loader;

  const reload = useCallback((opts?: LoadOpts) => ref.current(opts), []);
  const reloadQuiet = useCallback(() => ref.current({ quiet: true }), []);

  useRealtimeRefresh(realtimeEvents, () => {
    ref.current({ quiet: true }).catch(() => {});
  });

  return { reload, reloadQuiet, loaderRef: ref };
}
