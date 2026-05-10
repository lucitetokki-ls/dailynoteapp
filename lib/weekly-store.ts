"use client";

import { useEffect, useSyncExternalStore } from "react";

import { isSupabaseConfigured, retrySupabaseMutation, supabase } from "@/lib/supabase";
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
  window.localStorage.setItem(getStorageKey(reflection.weekKey), JSON.stringify(reflection));
  emitStoreChange();
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
  window.addEventListener(storeEventName, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(storeEventName, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
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

export function createDefaultWeeklyReflection(weekKey: string): WeeklyReflection {
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

export function readWeeklyReflection(weekKey: string) {
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

export function writeWeeklyReflection(reflection: WeeklyReflection) {
  writeWeeklyReflectionLocally(reflection);

  if (supabase) {
    const client = supabase;

    void retrySupabaseMutation(async () => {
      const { error } = await client
        .from("weekly_reflections")
        .upsert(mapWeeklyReflectionToRow(reflection), { onConflict: "week_key" });

      if (error) {
        console.warn("Failed to save weekly reflection to Supabase", error.message);
        return { ok: false, message: error.message };
      }

      return { ok: true };
    });
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

export function readAllWeeklyReflections() {
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
    .select("*")
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

  const { data, error } = await supabase
    .from("weekly_reflections")
    .select("*")
    .order("week_key", { ascending: false })
    .returns<WeeklyReflectionRow[]>();

  if (error) {
    console.warn("Failed to fetch weekly reflections from Supabase", error.message);
    loadedAllWeeklyReflections = false;
    return;
  }

  (data ?? []).forEach((row) => {
    const remoteReflection = mapWeeklyReflectionRow(row);
    const localReflection = readWeeklyReflection(row.week_key);

    loadedWeekKeys.add(row.week_key);

    if (shouldKeepLocalWeeklyReflection(localReflection, remoteReflection)) {
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

export function writeWeeklyReflections(reflections: WeeklyReflection[]) {
  reflections.forEach((reflection) => writeWeeklyReflection(reflection));
}

export function clearAllWeeklyReflections() {
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

  if (supabase) {
    const client = supabase;

    void retrySupabaseMutation(async () => {
      const { error } = await client
        .from("weekly_reflections")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) {
        console.warn("Failed to delete weekly reflections from Supabase", error.message);
        return { ok: false, message: error.message };
      }

      return { ok: true };
    });
  }
}
