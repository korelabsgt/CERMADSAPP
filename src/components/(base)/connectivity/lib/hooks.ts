"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ConnectivityStatus =
  | "online"
  | "offline"
  | "unstable"
  | "db-disconnected";

type PingResult = { ok: boolean; latency: number };

const INTERNET_OK_INTERVAL_MS = 60_000;
const INTERNET_ALERT_INTERVAL_MS = 20_000;
const DB_OK_INTERVAL_MS = 5 * 60_000;
const DB_ALERT_INTERVAL_MS = 45_000;
const PING_TIMEOUT_MS = 5000;
const SLOW_THRESHOLD_MS = 2500;
const HISTORY_SIZE = 4;
const UNSTABLE_FAIL_THRESHOLD = 2;

type NetworkConnection = {
  effectiveType?: string;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
};

function getNetworkConnection(): NetworkConnection | undefined {
  if (typeof navigator === "undefined") return undefined;
  return (navigator as Navigator & { connection?: NetworkConnection }).connection;
}

function isSlowConnection(): boolean {
  const type = getNetworkConnection()?.effectiveType;
  return type === "slow-2g" || type === "2g";
}

export function useConnectivity() {
  const [status, setStatus] = useState<ConnectivityStatus>("online");
  const statusRef = useRef<ConnectivityStatus>("online");
  const historyRef = useRef<PingResult[]>([]);
  const dbOkRef = useRef(true);
  const lastDbCheckRef = useRef(0);
  const internetTimerRef = useRef<number | undefined>(undefined);
  const dbTimerRef = useRef<number | undefined>(undefined);

  const updateStatus = useCallback((next: ConnectivityStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const pingInternet = useCallback(async (): Promise<PingResult> => {
    const start = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);

    try {
      const res = await fetch("/api/health", {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });
      return { ok: res.ok, latency: performance.now() - start };
    } catch {
      return { ok: false, latency: performance.now() - start };
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  const checkDb = useCallback(async (): Promise<boolean> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);

    try {
      const res = await fetch("/api/health?db=1", {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });
      lastDbCheckRef.current = Date.now();
      return res.ok;
    } catch {
      lastDbCheckRef.current = Date.now();
      return false;
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  const evaluateStatus = useCallback(
    (navigatorOnline: boolean, dbOk: boolean): ConnectivityStatus => {
      if (!navigatorOnline) return "offline";

      const history = historyRef.current;
      const recentFails = history.filter((entry) => !entry.ok).length;
      const slowPings = history.filter(
        (entry) => entry.ok && entry.latency > SLOW_THRESHOLD_MS,
      ).length;
      const successful = history.filter((entry) => entry.ok);
      const avgLatency =
        successful.reduce((sum, entry) => sum + entry.latency, 0) /
        Math.max(1, successful.length);

      if (!dbOk) return "db-disconnected";

      if (
        isSlowConnection() ||
        recentFails >= UNSTABLE_FAIL_THRESHOLD ||
        (recentFails >= 1 && slowPings >= 1) ||
        (history.length >= 3 && recentFails / history.length >= 0.34) ||
        (successful.length >= 3 && avgLatency > SLOW_THRESHOLD_MS)
      ) {
        return "unstable";
      }

      return "online";
    },
    [],
  );

  const clearTimers = useCallback(() => {
    if (internetTimerRef.current !== undefined) {
      window.clearTimeout(internetTimerRef.current);
      internetTimerRef.current = undefined;
    }
    if (dbTimerRef.current !== undefined) {
      window.clearTimeout(dbTimerRef.current);
      dbTimerRef.current = undefined;
    }
  }, []);

  const scheduleInternetCheck = useCallback(
    (delay?: number) => {
      if (typeof document !== "undefined" && document.hidden) return;

      if (internetTimerRef.current !== undefined) {
        window.clearTimeout(internetTimerRef.current);
      }

      const current = statusRef.current;
      const wait =
        delay ??
        (current === "online" || current === "db-disconnected"
          ? INTERNET_OK_INTERVAL_MS
          : INTERNET_ALERT_INTERVAL_MS);

      internetTimerRef.current = window.setTimeout(() => {
        void (async () => {
          const navigatorOnline = navigator.onLine;

          if (!navigatorOnline) {
            updateStatus("offline");
            scheduleInternetCheck(INTERNET_ALERT_INTERVAL_MS);
            return;
          }

          const result = await pingInternet();
          historyRef.current = [...historyRef.current, result].slice(
            -HISTORY_SIZE,
          );
          updateStatus(evaluateStatus(true, dbOkRef.current));
          scheduleInternetCheck();
        })();
      }, wait);
    },
    [evaluateStatus, pingInternet, updateStatus],
  );

  const scheduleDbCheck = useCallback(
    (delay?: number) => {
      if (typeof document !== "undefined" && document.hidden) return;
      if (!navigator.onLine) return;

      if (dbTimerRef.current !== undefined) {
        window.clearTimeout(dbTimerRef.current);
      }

      const current = statusRef.current;
      const baseDelay =
        delay ??
        (current === "db-disconnected"
          ? DB_ALERT_INTERVAL_MS
          : DB_OK_INTERVAL_MS);
      const sinceLastDb = Date.now() - lastDbCheckRef.current;
      const wait = Math.max(0, baseDelay - sinceLastDb);

      dbTimerRef.current = window.setTimeout(() => {
        void (async () => {
          if (!navigator.onLine) return;

          const dbOk = await checkDb();
          dbOkRef.current = dbOk;
          updateStatus(evaluateStatus(true, dbOk));
          scheduleDbCheck();
        })();
      }, wait);
    },
    [checkDb, evaluateStatus, updateStatus],
  );

  const runImmediateChecks = useCallback(async () => {
    const navigatorOnline = navigator.onLine;

    if (!navigatorOnline) {
      updateStatus("offline");
      return;
    }

    const result = await pingInternet();
    historyRef.current = [...historyRef.current, result].slice(-HISTORY_SIZE);

    const dbOk = await checkDb();
    dbOkRef.current = dbOk;
    updateStatus(evaluateStatus(true, dbOk));
  }, [checkDb, evaluateStatus, pingInternet, updateStatus]);

  useEffect(() => {
    void runImmediateChecks();
    scheduleInternetCheck();
    scheduleDbCheck();

    const onOnline = () => {
      void runImmediateChecks();
      scheduleInternetCheck(INTERNET_ALERT_INTERVAL_MS);
      scheduleDbCheck(DB_ALERT_INTERVAL_MS);
    };

    const onOffline = () => {
      updateStatus("offline");
      clearTimers();
      scheduleInternetCheck(INTERNET_ALERT_INTERVAL_MS);
    };

    const onVisibility = () => {
      if (document.hidden) {
        clearTimers();
        return;
      }

      void runImmediateChecks();
      scheduleInternetCheck();
      scheduleDbCheck();
    };

    const connection = getNetworkConnection();
    const onConnectionChange = () => {
      updateStatus(evaluateStatus(navigator.onLine, dbOkRef.current));
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisibility);
    connection?.addEventListener?.("change", onConnectionChange);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisibility);
      connection?.removeEventListener?.("change", onConnectionChange);
      clearTimers();
    };
  }, [
    clearTimers,
    evaluateStatus,
    runImmediateChecks,
    scheduleDbCheck,
    scheduleInternetCheck,
    updateStatus,
  ]);

  return status;
}
