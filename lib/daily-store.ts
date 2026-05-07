"use client";

import { useEffect, useSyncExternalStore } from "react";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { createEmptyDailyLog, getRecentDateKeys, getTodayDateKey } from "@/lib/utils";
import type {
  ActionCategory,
  ActionStatus,
  DailyAction,
  DailyActionSlot,
} from "@/types/daily-action";
import type { DailyLog } from "@/types/daily-log";

export type StoredDay = {
  dailyLog: DailyLog;
  actions: DailyAction[];
};

const storagePrefix = "daily-note:";
const storeEventName = "daily-note-store-change";
const syncEventName = "daily-note-sync-change";
const dailyDatePattern = /^\d{4}-\d{2}-\d{2}$/;

let snapshotVersion = 0;
let syncVersion = 0;
const loadedDates = new Set<string>();
let loadedAllDays = false;
let isClientStoreReady = false;
const syncStatuses = new Map<string, SupabaseSyncStatus>();

export type SupabaseSyncStatus = {
  status: "local-only" | "saving" | "saved" | "error";
  message: string;
  updatedAt: string | null;
};

const defaultSyncStatus: SupabaseSyncStatus = {
  status: isSupabaseConfigured ? "saved" : "local-only",
  message: isSupabaseConfigured ? "Supabase 대기 중" : "로컬 저장만 사용 중",
  updatedAt: null,
};

type DailyLogRow = {
  id: string;
  date: string;
  daily_mood: string;
  daily_reflection: string;
  created_at: string;
  updated_at: string;
};

type DailyActionRow = {
  id: string;
  daily_log_id: string;
  slot?: DailyActionSlot | null;
  category: ActionCategory;
  title: string;
  description: string;
  status: ActionStatus;
  satisfaction: number;
  reflection: string;
  created_at: string;
  updated_at: string;
};

function getStorageKey(date: string) {
  return `${storagePrefix}${date}`;
}

export function createDefaultStoredDay(date: string): StoredDay {
  return {
    dailyLog: createEmptyDailyLog(date),
    actions: [],
  };
}

function emitStoreChange() {
  snapshotVersion += 1;

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(storeEventName));
  }
}

function emitSyncChange() {
  syncVersion += 1;

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(syncEventName));
  }
}

function setSyncStatus(date: string, nextStatus: SupabaseSyncStatus) {
  syncStatuses.set(date, nextStatus);
  emitSyncChange();
}

function markClientStoreReady() {
  if (typeof window === "undefined" || isClientStoreReady) {
    return;
  }

  isClientStoreReady = true;
  emitStoreChange();
}

function canReadBrowserStore() {
  return typeof window !== "undefined";
}

function writeStoredDayLocally(date: string, nextDay: StoredDay) {
  window.localStorage.setItem(getStorageKey(date), JSON.stringify(nextDay));
  emitStoreChange();
}

function mapDailyLogRow(row: DailyLogRow): DailyLog {
  return {
    id: row.id,
    date: row.date,
    dailyMood: row.daily_mood,
    dailyReflection: row.daily_reflection,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDailyLogToRow(log: DailyLog): DailyLogRow {
  return {
    id: log.id,
    date: log.date,
    daily_mood: log.dailyMood,
    daily_reflection: log.dailyReflection,
    created_at: log.createdAt,
    updated_at: log.updatedAt,
  };
}

function mapDailyActionRow(row: DailyActionRow): DailyAction {
  return {
    id: row.id,
    dailyLogId: row.daily_log_id,
    slot: row.slot ?? undefined,
    category: row.category,
    title: row.title,
    description: row.description,
    status: row.status,
    satisfaction: row.satisfaction,
    reflection: row.reflection,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDailyActionToRow(action: DailyAction): DailyActionRow {
  return {
    id: action.id,
    daily_log_id: action.dailyLogId,
    slot: action.slot,
    category: action.category,
    title: action.title,
    description: action.description,
    status: action.status,
    satisfaction: action.satisfaction,
    reflection: action.reflection,
    created_at: action.createdAt,
    updated_at: action.updatedAt,
  };
}

function subscribeToStoredDays(onStoreChange: () => void) {
  window.addEventListener(storeEventName, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(storeEventName, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function readStoredDay(date: string): StoredDay {
  if (!canReadBrowserStore()) {
    return createDefaultStoredDay(date);
  }

  return readStoredDayFromLocalStorage(date);
}

function readStoredDayFromLocalStorage(date: string): StoredDay {
  if (typeof window === "undefined") {
    return createDefaultStoredDay(date);
  }

  const raw = window.localStorage.getItem(getStorageKey(date));

  if (!raw) {
    return createDefaultStoredDay(date);
  }

  try {
    return JSON.parse(raw) as StoredDay;
  } catch {
    return createDefaultStoredDay(date);
  }
}

function hasUserContent(day: StoredDay) {
  return Boolean(
    day.dailyLog.dailyReflection.trim() ||
      day.actions.some((action) => action.description.trim() || action.reflection.trim()),
  );
}

export function writeStoredDay(date: string, nextDay: StoredDay) {
  writeStoredDayLocally(date, nextDay);

  if (isSupabaseConfigured) {
    const now = new Date().toISOString();
    setSyncStatus(date, {
      status: "saving",
      message: "Supabase 저장 중",
      updatedAt: now,
    });

    void persistStoredDayToSupabase(nextDay).then((result) => {
      setSyncStatus(date, {
        status: result.ok ? "saved" : "error",
        message: result.ok
          ? "Supabase 저장됨"
          : result.message || "Supabase 저장 실패",
        updatedAt: new Date().toISOString(),
      });
    });
    return;
  }

  setSyncStatus(date, {
    status: "local-only",
    message: "로컬 저장됨",
    updatedAt: new Date().toISOString(),
  });
}

export function updateStoredDay(
  date: string,
  updater: (currentDay: StoredDay) => StoredDay,
) {
  writeStoredDay(date, updater(readStoredDay(date)));
}

export function updateStoredAction(
  date: string,
  actionId: string,
  updates: Partial<DailyAction>,
) {
  const now = new Date().toISOString();

  updateStoredDay(date, (currentDay) => ({
    dailyLog: {
      ...currentDay.dailyLog,
      updatedAt: now,
    },
    actions: currentDay.actions.map((action) =>
      action.id === actionId
        ? {
            ...action,
            ...updates,
            updatedAt: now,
          }
        : action,
    ),
  }));
}

export function deleteStoredAction(date: string, actionId: string) {
  const now = new Date().toISOString();

  updateStoredDay(date, (currentDay) => ({
    dailyLog: {
      ...currentDay.dailyLog,
      updatedAt: now,
    },
    actions: currentDay.actions.filter((action) => action.id !== actionId),
  }));
}

export function readAllStoredDays() {
  if (!canReadBrowserStore()) {
    return [];
  }

  const days: StoredDay[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);

    if (!key?.startsWith(storagePrefix)) {
      continue;
    }

    const date = key.slice(storagePrefix.length);

    if (!dailyDatePattern.test(date)) {
      continue;
    }

    days.push(readStoredDay(date));
  }

  return days.sort((first, second) => second.dailyLog.date.localeCompare(first.dailyLog.date));
}

async function fetchStoredDayFromSupabase(date: string) {
  if (!supabase) {
    return null;
  }

  const { data: logRow, error: logError } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("date", date)
    .maybeSingle<DailyLogRow>();

  if (logError) {
    console.warn("Failed to fetch daily log from Supabase", logError.message);
    return null;
  }

  if (!logRow) {
    return null;
  }

  const { data: actionRows, error: actionError } = await supabase
    .from("daily_actions")
    .select("*")
    .eq("daily_log_id", logRow.id)
    .order("created_at", { ascending: false })
    .returns<DailyActionRow[]>();

  if (actionError) {
    console.warn("Failed to fetch daily actions from Supabase", actionError.message);
    return null;
  }

  return {
    dailyLog: mapDailyLogRow(logRow),
    actions: (actionRows ?? []).map(mapDailyActionRow),
  };
}

async function syncStoredDayFromSupabase(date: string) {
  if (!isSupabaseConfigured || loadedDates.has(date)) {
    return;
  }

  loadedDates.add(date);

  const remoteDay = await fetchStoredDayFromSupabase(date);

  if (remoteDay) {
    const localDay = readStoredDayFromLocalStorage(date);

    if (!hasUserContent(remoteDay) && hasUserContent(localDay)) {
      return;
    }

    writeStoredDayLocally(date, remoteDay);
  }
}

async function syncAllStoredDaysFromSupabase() {
  if (!supabase || loadedAllDays) {
    return;
  }

  loadedAllDays = true;

  const { data: logRows, error: logError } = await supabase
    .from("daily_logs")
    .select("*")
    .order("date", { ascending: false })
    .returns<DailyLogRow[]>();

  if (logError) {
    console.warn("Failed to fetch daily logs from Supabase", logError.message);
    return;
  }

  const { data: actionRows, error: actionError } = await supabase
    .from("daily_actions")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<DailyActionRow[]>();

  if (actionError) {
    console.warn("Failed to fetch daily actions from Supabase", actionError.message);
    return;
  }

  const actionsByLogId = new Map<string, DailyAction[]>();

  (actionRows ?? []).forEach((row) => {
    const action = mapDailyActionRow(row);
    const currentActions = actionsByLogId.get(row.daily_log_id) ?? [];

    actionsByLogId.set(row.daily_log_id, [...currentActions, action]);
  });

  (logRows ?? []).forEach((row) => {
    loadedDates.add(row.date);
    writeStoredDayLocally(row.date, {
      dailyLog: mapDailyLogRow(row),
      actions: actionsByLogId.get(row.id) ?? [],
    });
  });
}

async function persistStoredDayToSupabase(day: StoredDay): Promise<{
  ok: boolean;
  message?: string;
}> {
  if (!supabase) {
    return { ok: true };
  }

  const { error: logError } = await supabase
    .from("daily_logs")
    .upsert(mapDailyLogToRow(day.dailyLog), { onConflict: "id" });

  if (logError) {
    console.warn("Failed to save daily log to Supabase", logError.message);
    return { ok: false, message: logError.message };
  }

  if (day.actions.length > 0) {
    const { error: actionsError } = await supabase
      .from("daily_actions")
      .upsert(day.actions.map(mapDailyActionToRow), { onConflict: "id" });

    if (actionsError) {
      console.warn("Failed to save daily actions to Supabase", actionsError.message);
      return { ok: false, message: actionsError.message };
    }
  }

  const { data: remoteActions, error: remoteActionsError } = await supabase
    .from("daily_actions")
    .select("id")
    .eq("daily_log_id", day.dailyLog.id)
    .returns<Array<{ id: string }>>();

  if (remoteActionsError) {
    console.warn("Failed to inspect remote daily actions", remoteActionsError.message);
    return { ok: false, message: remoteActionsError.message };
  }

  const localActionIds = new Set(day.actions.map((action) => action.id));
  const idsToDelete = (remoteActions ?? [])
    .map((action) => action.id)
    .filter((id) => !localActionIds.has(id));

  if (idsToDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("daily_actions")
      .delete()
      .in("id", idsToDelete);

    if (deleteError) {
      console.warn("Failed to delete removed daily actions from Supabase", deleteError.message);
      return { ok: false, message: deleteError.message };
    }
  }

  return { ok: true };
}

export function readRecentStoredDays(count: number) {
  return getRecentDateKeys(count).map((date) => readStoredDay(date));
}

function getAllDaysSnapshot() {
  if (!canReadBrowserStore()) {
    return "server";
  }

  return `${snapshotVersion}:${window.localStorage.length}`;
}

function getServerSnapshot() {
  return "server";
}

function subscribeToSyncStatus(onStoreChange: () => void) {
  window.addEventListener(syncEventName, onStoreChange);

  return () => window.removeEventListener(syncEventName, onStoreChange);
}

function getSyncSnapshot() {
  return `${syncVersion}:${syncStatuses.size}`;
}

export function readSupabaseSyncStatus(date: string) {
  return syncStatuses.get(date) ?? defaultSyncStatus;
}

export function useSupabaseSyncStatus(date: string) {
  useSyncExternalStore(subscribeToSyncStatus, getSyncSnapshot, getServerSnapshot);

  return readSupabaseSyncStatus(date);
}

export function useStoredDay(date = getTodayDateKey()) {
  useSyncExternalStore(subscribeToStoredDays, getAllDaysSnapshot, getServerSnapshot);
  useEffect(() => {
    markClientStoreReady();
    void syncStoredDayFromSupabase(date);
  }, [date]);
  return readStoredDay(date);
}

export function useStoredDays() {
  useSyncExternalStore(subscribeToStoredDays, getAllDaysSnapshot, getServerSnapshot);
  useEffect(() => {
    markClientStoreReady();
    void syncAllStoredDaysFromSupabase();
  }, []);
  return readAllStoredDays();
}

export function useRecentStoredDays(count: number) {
  useSyncExternalStore(subscribeToStoredDays, getAllDaysSnapshot, getServerSnapshot);
  useEffect(() => {
    markClientStoreReady();
    getRecentDateKeys(count).forEach((date) => {
      void syncStoredDayFromSupabase(date);
    });
  }, [count]);
  return readRecentStoredDays(count);
}

export function clearStoredDay(date: string) {
  window.localStorage.removeItem(getStorageKey(date));
  emitStoreChange();

  if (supabase) {
    void supabase.from("daily_logs").delete().eq("date", date);
  }
}

export function clearAllStoredDays() {
  const keysToRemove: string[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);

    const date = key?.slice(storagePrefix.length);

    if (key?.startsWith(storagePrefix) && date && dailyDatePattern.test(date)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => window.localStorage.removeItem(key));
  emitStoreChange();

  if (supabase) {
    void supabase.from("daily_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  }
}
