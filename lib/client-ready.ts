"use client";

import { useSyncExternalStore } from "react";

function subscribeToClientReady(onStoreChange: () => void) {
  const timeoutId = window.setTimeout(onStoreChange, 0);

  return () => window.clearTimeout(timeoutId);
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export function useClientReady() {
  return useSyncExternalStore(
    subscribeToClientReady,
    getClientSnapshot,
    getServerSnapshot,
  );
}
