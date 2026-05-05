"use client";

import { useEffect, useSyncExternalStore } from "react";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { createStableUuid, getTodayDateKey } from "@/lib/utils";
import type { WritingEntry } from "@/types/writing-entry";

const writingStoragePrefix = "daily-note-writing:";
const writingStoreEventName = "daily-note-writing-store-change";
const writingSyncEventName = "daily-note-writing-sync-change";

let writingSnapshotVersion = 0;
let writingSyncVersion = 0;
const loadedWritingDates = new Set<string>();
const writingSyncStatuses = new Map<string, WritingSyncStatus>();

export type WritingSyncStatus = {
  status: "local-only" | "saving" | "saved" | "error";
  message: string;
  updatedAt: string | null;
};

const defaultWritingSyncStatus: WritingSyncStatus = {
  status: isSupabaseConfigured ? "saved" : "local-only",
  message: isSupabaseConfigured ? "Supabase 대기 중" : "로컬 저장만 사용 중",
  updatedAt: null,
};

type WritingEntryRow = {
  id: string;
  date: string;
  content: string;
  created_at: string;
  updated_at: string;
};

function getWritingStorageKey(date: string) {
  return `${writingStoragePrefix}${date}`;
}

function emitWritingStoreChange() {
  writingSnapshotVersion += 1;

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(writingStoreEventName));
  }
}

function emitWritingSyncChange() {
  writingSyncVersion += 1;

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(writingSyncEventName));
  }
}

function setWritingSyncStatus(date: string, nextStatus: WritingSyncStatus) {
  writingSyncStatuses.set(date, nextStatus);
  emitWritingSyncChange();
}

function mapWritingEntryRow(row: WritingEntryRow): WritingEntry {
  return {
    id: row.id,
    date: row.date,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapWritingEntryToRow(entry: WritingEntry): WritingEntryRow {
  return {
    id: entry.id,
    date: entry.date,
    content: entry.content,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
  };
}

export function createDefaultWritingEntry(date: string): WritingEntry {
  const fallbackTimestamp = `${date}T00:00:00.000Z`;

  return {
    id: createStableUuid(`daily-writing:${date}`),
    date,
    content: "",
    createdAt: fallbackTimestamp,
    updatedAt: fallbackTimestamp,
  };
}

function readWritingEntryFromLocalStorage(date: string): WritingEntry {
  if (typeof window === "undefined") {
    return createDefaultWritingEntry(date);
  }

  const raw = window.localStorage.getItem(getWritingStorageKey(date));

  if (!raw) {
    return createDefaultWritingEntry(date);
  }

  try {
    return JSON.parse(raw) as WritingEntry;
  } catch {
    return createDefaultWritingEntry(date);
  }
}

function writeWritingEntryLocally(date: string, entry: WritingEntry) {
  window.localStorage.setItem(getWritingStorageKey(date), JSON.stringify(entry));
  emitWritingStoreChange();
}

async function fetchWritingEntryFromSupabase(date: string) {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("daily_writings")
    .select("*")
    .eq("date", date)
    .maybeSingle<WritingEntryRow>();

  if (error) {
    console.warn("Failed to fetch daily writing from Supabase", error.message);
    setWritingSyncStatus(date, {
      status: "error",
      message: "Writing 테이블 확인 필요",
      updatedAt: new Date().toISOString(),
    });
    return null;
  }

  return data ? mapWritingEntryRow(data) : null;
}

async function syncWritingEntryFromSupabase(date: string) {
  if (!isSupabaseConfigured || loadedWritingDates.has(date)) {
    return;
  }

  loadedWritingDates.add(date);

  const remoteEntry = await fetchWritingEntryFromSupabase(date);

  if (remoteEntry) {
    const localEntry = readWritingEntryFromLocalStorage(date);

    if (!remoteEntry.content.trim() && localEntry.content.trim()) {
      return;
    }

    writeWritingEntryLocally(date, remoteEntry);
  }
}

async function persistWritingEntryToSupabase(entry: WritingEntry): Promise<{
  ok: boolean;
  message?: string;
}> {
  if (!supabase) {
    return { ok: true };
  }

  const { error } = await supabase
    .from("daily_writings")
    .upsert(mapWritingEntryToRow(entry), { onConflict: "date" });

  if (error) {
    console.warn("Failed to save daily writing to Supabase", error.message);
    return { ok: false, message: error.message };
  }

  return { ok: true };
}

export function readWritingEntry(date: string): WritingEntry {
  if (typeof window === "undefined") {
    return createDefaultWritingEntry(date);
  }

  return readWritingEntryFromLocalStorage(date);
}

export function writeWritingEntry(date: string, content: string) {
  const currentEntry = readWritingEntry(date);
  const now = new Date().toISOString();
  const nextEntry: WritingEntry = {
    ...currentEntry,
    content,
    updatedAt: now,
  };

  writeWritingEntryLocally(date, nextEntry);

  if (!isSupabaseConfigured) {
    setWritingSyncStatus(date, {
      status: "local-only",
      message: "로컬 저장됨",
      updatedAt: now,
    });
    return;
  }

  setWritingSyncStatus(date, {
    status: "saving",
    message: "Supabase 저장 중",
    updatedAt: now,
  });

  void persistWritingEntryToSupabase(nextEntry).then((result) => {
    setWritingSyncStatus(date, {
      status: result.ok ? "saved" : "error",
      message: result.ok ? "Supabase 저장됨" : result.message || "Supabase 저장 실패",
      updatedAt: new Date().toISOString(),
    });
  });
}

function subscribeToWritingEntry(onStoreChange: () => void) {
  window.addEventListener(writingStoreEventName, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(writingStoreEventName, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function subscribeToWritingSyncStatus(onStoreChange: () => void) {
  window.addEventListener(writingSyncEventName, onStoreChange);

  return () => window.removeEventListener(writingSyncEventName, onStoreChange);
}

function getWritingSnapshot() {
  if (typeof window === "undefined") {
    return "server";
  }

  return `${writingSnapshotVersion}:${window.localStorage.length}`;
}

function getWritingSyncSnapshot() {
  return `${writingSyncVersion}:${writingSyncStatuses.size}`;
}

function getServerSnapshot() {
  return "server";
}

export function readWritingSyncStatus(date: string) {
  return writingSyncStatuses.get(date) ?? defaultWritingSyncStatus;
}

export function useWritingEntry(date = getTodayDateKey()) {
  useSyncExternalStore(subscribeToWritingEntry, getWritingSnapshot, getServerSnapshot);
  useEffect(() => {
    void syncWritingEntryFromSupabase(date);
  }, [date]);
  return readWritingEntry(date);
}

export function useWritingSyncStatus(date: string) {
  useSyncExternalStore(subscribeToWritingSyncStatus, getWritingSyncSnapshot, getServerSnapshot);

  return readWritingSyncStatus(date);
}
