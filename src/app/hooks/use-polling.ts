// usePolling — Generic polling utility hook

import { useEffect, useRef } from "react";

interface UsePollingOptions {
  enabled: boolean;
  intervalMs?: number;
  onPoll: () => Promise<boolean>; // Return true to stop polling
}

export function usePolling({ enabled, intervalMs = 2000, onPoll }: UsePollingOptions) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const poll = async () => {
      const shouldStop = await onPoll();
      if (shouldStop && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    intervalRef.current = setInterval(poll, intervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, intervalMs, onPoll]);
}
