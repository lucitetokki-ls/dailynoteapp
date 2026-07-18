"use client";

import { useEffect, useSyncExternalStore } from "react";

import { isSupabaseConfigured, retrySupabaseMutation, supabase } from "@/lib/supabase";
import {
  enqueueSyncOperation,
  registerSyncHandler,
  replaceDomainWithDeleteOperation,
} from "@/lib/sync-engine";
import { collectSupabasePages } from "@/lib/supabase-pagination";
import { createStableUuid, getWeekKey } from "@/lib/utils";
import type { WeeklyReflection } from "@/types/weekly-reflection";

const storagePrefix = "daily-note-week:";
const storeEventName = "daily-note-week-store-change";
const weekPattern = /^\d{4}-W\d{2}$/;

let snapshotVersion = 0;
const loadedWeekKeys = new Set<string>();
let loadedAllWeeklyReflections = false;
let isClientWeeklyStoreReady = false;

type WeeklyReflectionRow = {
  id: string;
  week_key: string;
  wins: string;
  blockers: string;
  next_focus: string;
  created_at: string;
  updated_at: string;
};

const weeklyReflectionColumns =
  "id,week_key,wins,blockers,next_focus,created_at,updated_at";

function getStorageKey(weekKey: string) {
  return `${storagePrefix}${weekKey}`;
}

function emitStoreChange() {
  snapshotVersion += 1;

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(storeEventName));
  }
}

function markClientWeeklyStoreReady() {
  if (typeof window === "undefined" || isClientWeeklyStoreReady) {
    return;
  }

  isClientWeeklyStoreReady = true;
  emitStoreChange();
}

function canReadBrowserWeeklyStore() {
  return typeof window !== "undefined";
}

function writeWeeklyReflectionLocally(reflection: WeeklyReflection) {
  try {
    window.localStorage.setItem(getStorageKey(reflection.weekKey), JSON.stringify(reflection));
    emitStoreChange();
  } catch (error) {
    console.warn("Failed to save weekly reflection to browser storage", error);
    throw error;
  }
}

function hasWeeklyReflectionContent(reflection: WeeklyReflection) {
  return Boolean(
    reflection.wins.trim() || reflection.blockers.trim() || reflection.nextFocus.trim(),
  );
}

function shouldKeepLocalWeeklyReflection(
  localReflection: WeeklyReflection,
  remoteReflection: WeeklyReflection,
) {
  return Boolean(
    hasWeeklyReflectionContent(localReflection) &&
      (!hasWeeklyReflectionContent(remoteReflection) ||
        localReflection.updatedAt > remoteReflection.updatedAt),
  );
}

function mapWeeklyReflectionRow(row: WeeklyReflectionRow): WeeklyReflection {
  return {
    id: row.id,
    weekKey: row.week_key,
    wins: row.wins,
    blockers: row.blockers,
    nextFocus: row.next_focus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapWeeklyReflectionToRow(reflection: WeeklyReflection): WeeklyReflectionRow {
  return {
    id: reflection.id,
    week_key: reflection.weekKey,
    wins: reflection.wins,
    blockers: reflection.blockers,
    next_focus: reflection.nextFocus,
    created_at: reflection.createdAt,
    updated_at: reflection.updatedAt,
  };
}

function subscribeToWeeklyReflections(onStoreChange: () => void) {
  const handleStorageChange = (event: StorageEvent) => {
    if (!event.key?.startsWith(storagePrefix)) {
      return;
    }

    snapshotVersion += 1;
    onStoreChange();
  };

  window.addEventListener(storeEventName, onStoreChange);
  window.addEventListener("storage", handleStorageChange);

  return () => {
    window.removeEventListener(storeEventName, onStoreChange);
    window.removeEventListener("storage", handleStorageChange);
  };
}

function getSnapshot() {
  if (!canReadBrowserWeeklyStore()) {
    return "server";
  }

  return `${snapshotVersion}:${window.localStorage.length}`;
}

function getServerSnapshot() {
  return "server";
}

function createDefaultWeeklyReflection(weekKey: string): WeeklyReflection {
  const fallbackTimestamp = "1970-01-01T00:00:00.000Z";

  return {
    id: createStableUuid(`weekly-reflection:${weekKey}`),
    weekKey,
    wins: "",
    blockers: "",
    nextFocus: "",
    createdAt: fallbackTimestamp,
    updatedAt: fallbackTimestamp,
  };
}

function readWeeklyReflection(weekKey: string) {
  if (!canReadBrowserWeeklyStore()) {
    return createDefaultWeeklyReflection(weekKey);
  }

  const raw = window.localStorage.getItem(getStorageKey(weekKey));

  if (!raw) {
    return createDefaultWeeklyReflection(weekKey);
  }

  try {
    return JSON.parse(raw) as WeeklyReflection;
  } catch {
    return createDefaultWeeklyReflection(weekKey);
  }
}

async function persistWeeklyReflectionToSupabase(reflection: WeeklyReflection) {
  if (!supabase) {
    return { ok: true };
  }

  const { error } = await supabase
    .from("weekly_reflections")
    .upsert(mapWeeklyReflectionToRow(reflection), { onConflict: "week_key" });

  if (error) {
    console.warn("Failed to save weekly reflection to Supabase", error.message);
    return { ok: false, message: error.message };
  }

  return { ok: true };
}

function writeWeeklyReflection(reflection: WeeklyReflection) {
  writeWeeklyReflectionLocally(reflection);

  if (supabase) {
    void enqueueSyncOperation("weekly-upsert", reflection.weekKey, reflection);
  }
}

export function updateWeeklyReflection(
  weekKey: string,
  updates: Partial<Omit<WeeklyReflection, "id" | "weekKey" | "createdAt">>,
) {
  const current = readWeeklyReflection(weekKey);

  writeWeeklyReflection({
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

function readAllWeeklyReflections() {
  if (!canReadBrowserWeeklyStore()) {
    return [];
  }

  const reflections: WeeklyReflection[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    const weekKey = key?.slice(storagePrefix.length);

    if (!key?.startsWith(storagePrefix) || !weekKey || !weekPattern.test(weekKey)) {
      continue;
    }

    reflections.push(readWeeklyReflection(weekKey));
  }

  return reflections.sort((first, second) => second.weekKey.localeCompare(first.weekKey));
}

async function syncWeeklyReflectionFromSupabase(weekKey: string) {
  if (!supabase || loadedWeekKeys.has(weekKey)) {
    return;
  }

  loadedWeekKeys.add(weekKey);

  const { data, error } = await supabase
    .from("weekly_reflections")
    .select(weeklyReflectionColumns)
    .eq("week_key", weekKey)
    .maybeSingle<WeeklyReflectionRow>();

  if (error) {
    console.warn("Failed to fetch weekly reflection from Supabase", error.message);
    loadedWeekKeys.delete(weekKey);
    return;
  }

  if (data) {
    const remoteReflection = mapWeeklyReflectionRow(data);
    const localReflection = readWeeklyReflection(weekKey);

    if (shouldKeepLocalWeeklyReflection(localReflection, remoteReflection)) {
      void enqueueSyncOperation("weekly-upsert", weekKey, localReflection);
      return;
    }

    writeWeeklyReflectionLocally(remoteReflection);
  }
}

async function syncAllWeeklyReflectionsFromSupabase() {
  if (!isSupabaseConfigured || !supabase || loadedAllWeeklyReflections) {
    return;
  }

  loadedAllWeeklyReflections = true;
  const client = supabase;

  let rows: WeeklyReflectionRow[];

  try {
    rows = await collectSupabasePages<WeeklyReflectionRow>((from, to) =>
      client
        .from("weekly_reflections")
        .select(weeklyReflectionColumns)
        .order("week_key", { ascending: false })
        .range(from, to)
        .returns<WeeklyReflectionRow[]>(),
    );
  } catch (error) {
    console.warn("Failed to fetch weekly reflections from Supabase", error);
    loadedAllWeeklyReflections = false;
    return;
  }

  rows.forEach((row) => {
    const remoteReflection = mapWeeklyReflectionRow(row);
    const localReflection = readWeeklyReflection(row.week_key);

    loadedWeekKeys.add(row.week_key);

    if (shouldKeepLocalWeeklyReflection(localReflection, remoteReflection)) {
      void enqueueSyncOperation("weekly-upsert", row.week_key, localReflection);
      return;
    }

    writeWeeklyReflectionLocally(remoteReflection);
  });
}

export function useWeeklyReflection(weekKey = getWeekKey()) {
  useSyncExternalStore(subscribeToWeeklyReflections, getSnapshot, getServerSnapshot);
  useEffect(() => {
    markClientWeeklyStoreReady();
    void syncWeeklyReflectionFromSupabase(weekKey);
  }, [weekKey]);
  return readWeeklyReflection(weekKey);
}

export function useWeeklyReflections() {
  useSyncExternalStore(subscribeToWeeklyReflections, getSnapshot, getServerSnapshot);
  useEffect(() => {
    markClientWeeklyStoreReady();
    void syncAllWeeklyReflectionsFromSupabase();
  }, []);
  return readAllWeeklyReflections();
}

export async function writeWeeklyReflections(reflections: WeeklyReflection[]) {
  return Promise.all(
    reflections.map(async (reflection) => {
      writeWeeklyReflectionLocally(reflection);
      return supabase
        ? enqueueSyncOperation("weekly-upsert", reflection.weekKey, reflection)
        : { ok: true, queued: false };
    }),
  );
}

async function deleteAllWeeklyReflectionsFromSupabase() {
  if (!supabase) {
    return { ok: true };
  }

  const { error } = await supabase
    .from("weekly_reflections")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    console.warn("Failed to delete weekly reflections from Supabase", error.message);
    return { ok: false, message: error.message };
  }

  return { ok: true };
}

export async function clearAllWeeklyReflections({ syncRemote = true } = {}) {
  const result = supabase && syncRemote
    ? await replaceDomainWithDeleteOperation(["weekly-upsert"], "weekly-delete-all")
    : { ok: true, queued: false };

  if (!result.ok && !result.queued) {
    return result;
  }

  const keysToRemove: string[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    const weekKey = key?.slice(storagePrefix.length);

    if (key?.startsWith(storagePrefix) && weekKey && weekPattern.test(weekKey)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => window.localStorage.removeItem(key));
  emitStoreChange();

  return result;
}

registerSyncHandler("weekly-upsert", (payload) =>
  retrySupabaseMutation(() => persistWeeklyReflectionToSupabase(payload as WeeklyReflection)),
);
registerSyncHandler("weekly-delete-all", () =>
  retrySupabaseMutation(deleteAllWeeklyReflectionsFromSupabase),
);
