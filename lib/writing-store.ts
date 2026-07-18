"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { JSONContent } from "@tiptap/core";

import {
  deleteAllWritingEntriesFromDatabase,
  readAllWritingEntriesFromDatabase,
  readWritingEntryFromDatabase,
  writeWritingEntryToDatabase,
} from "@/lib/client-db";
import {
  enqueueSyncOperation,
  registerSyncHandler,
  replaceDomainWithDeleteOperation,
} from "@/lib/sync-engine";
import { collectSupabasePages } from "@/lib/supabase-pagination";
import {
  isSupabaseConfigured,
  retrySupabaseMutation,
  supabase,
  type SupabaseMutationResult,
} from "@/lib/supabase";
import { createStableUuid, getTodayDateKey } from "@/lib/utils";
import type { WritingEntry } from "@/types/writing-entry";

const writingStoragePrefix = "daily-note-writing:";
const writingStoreEventName = "daily-note-writing-store-change";
const writingSyncEventName = "daily-note-writing-sync-change";
const writingDatePattern = /^\d{4}-\d{2}-\d{2}$/;

let writingSnapshotVersion = 0;
let writingSyncVersion = 0;
const loadedWritingDates = new Set<string>();
let loadedAllWritingEntries = false;
let writingHydrationPromise: Promise<void> | null = null;
const writingEntriesCache = new Map<string, WritingEntry>();
const writingSyncStatuses = new Map<string, WritingSyncStatus>();

export type WritingSyncStatus = {
  status: "local-only" | "saving" | "saved" | "error";
  message: string;
  updatedAt: string | null;
};

const defaultWritingSyncStatus: WritingSyncStatus = {
  status: isSupabaseConfigured ? "saved" : "local-only",
  message: isSupabaseConfigured ? "동기화 준비됨" : "로컬 저장만 사용 중",
  updatedAt: null,
};

type WritingEntryRow = {
  id: string;
  date: string;
  title?: string | null;
  content: string;
  content_json?: JSONContent | null;
  content_markdown?: string | null;
  created_at: string;
  updated_at: string;
};

type WritingEntrySummaryRow = Pick<
  WritingEntryRow,
  "id" | "date" | "title" | "created_at" | "updated_at"
>;

const writingEntryColumns =
  "id,date,title,content,content_json,content_markdown,created_at,updated_at";

export type WritingEntryDraft = {
  title?: string;
  content: string;
  contentJson?: JSONContent | null;
  contentMarkdown?: string;
};

function isJsonContent(value: unknown): value is JSONContent {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getWritingContent(entry: Pick<WritingEntry, "content" | "contentMarkdown">) {
  return selectWritingContent(entry.contentMarkdown, entry.content);
}

function selectWritingContent(preferred: string | null | undefined, fallback: string | null | undefined) {
  return preferred?.trim() ? preferred : fallback ?? preferred ?? "";
}

function hasWritingContent(
  entry: Pick<WritingEntry, "title" | "content" | "contentMarkdown" | "contentJson">,
) {
  return (
    entry.title.trim().length > 0 ||
    Boolean(entry.contentJson) ||
    getWritingContent(entry).trim().length > 0
  );
}

function normalizeWritingEntry(
  entry: Partial<WritingEntry> | null | undefined,
  date: string,
): WritingEntry {
  const fallback = createDefaultWritingEntry(date);
  const contentMarkdown = selectWritingContent(entry?.contentMarkdown, entry?.content);

  return {
    id: entry?.id ?? fallback.id,
    date: entry?.date ?? fallback.date,
    title: typeof entry?.title === "string" ? entry.title.slice(0, 120) : fallback.title,
    content: contentMarkdown,
    contentJson: isJsonContent(entry?.contentJson) ? entry.contentJson : null,
    contentMarkdown,
    createdAt: entry?.createdAt ?? fallback.createdAt,
    updatedAt: entry?.updatedAt ?? fallback.updatedAt,
  };
}

function getWritingStorageKey(date: string) {
  return `${writingStoragePrefix}${date}`;
}

function emitWritingStoreChange() {
  writingSnapshotVersion += 1;

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(writingStoreEventName));
  }
}

function broadcastWritingStoreChange(date = "all") {
  if (typeof BroadcastChannel === "undefined") {
    return;
  }

  const channel = new BroadcastChannel(writingStoreEventName);
  channel.postMessage({ date });
  channel.close();
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
  const contentMarkdown = selectWritingContent(row.content_markdown, row.content);

  return {
    id: row.id,
    date: row.date,
    title: row.title?.slice(0, 120) ?? "",
    content: contentMarkdown,
    contentJson: isJsonContent(row.content_json) ? row.content_json : null,
    contentMarkdown,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapWritingEntryToRow(entry: WritingEntry) {
  const contentMarkdown = getWritingContent(entry);

  return {
    id: entry.id,
    date: entry.date,
    title: entry.title,
    content: contentMarkdown,
    content_json: entry.contentJson ?? null,
    content_markdown: contentMarkdown,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
  };
}

function createDefaultWritingEntry(date: string): WritingEntry {
  const fallbackTimestamp = `${date}T00:00:00.000Z`;

  return {
    id: createStableUuid(`daily-writing:${date}`),
    date,
    title: "",
    content: "",
    contentJson: null,
    contentMarkdown: "",
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
    return normalizeWritingEntry(JSON.parse(raw) as Partial<WritingEntry>, date);
  } catch {
    return createDefaultWritingEntry(date);
  }
}

function writeWritingEntryLocally(date: string, entry: WritingEntry) {
  const normalizedEntry = normalizeWritingEntry(entry, date);
  writingEntriesCache.set(date, normalizedEntry);
  emitWritingStoreChange();
  broadcastWritingStoreChange(date);

  void writeWritingEntryToDatabase(normalizedEntry).catch((error) => {
    console.warn("Failed to save daily writing to IndexedDB", error);
    setWritingSyncStatus(date, {
      status: "error",
      message: "브라우저 저장 공간을 확인하세요",
      updatedAt: new Date().toISOString(),
    });
  });
}

async function hydrateWritingEntries() {
  writingHydrationPromise ??= (async () => {
    const databaseEntries = await readAllWritingEntriesFromDatabase();
    databaseEntries.forEach((entry) => {
      const normalizedEntry = normalizeWritingEntry(entry, entry.date);
      const cachedEntry = writingEntriesCache.get(entry.date);

      if (!cachedEntry || normalizedEntry.updatedAt > cachedEntry.updatedAt) {
        writingEntriesCache.set(entry.date, normalizedEntry);
      }
    });

    if (typeof window !== "undefined") {
      const legacyKeys: string[] = [];

      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);

        if (key?.startsWith(writingStoragePrefix)) {
          legacyKeys.push(key);
        }
      }

      for (const key of legacyKeys) {
        const date = key.slice(writingStoragePrefix.length);

        if (!writingDatePattern.test(date)) {
          continue;
        }

        const legacyEntry = readWritingEntryFromLocalStorage(date);
        const databaseEntry = writingEntriesCache.get(date);

        if (!databaseEntry || legacyEntry.updatedAt > databaseEntry.updatedAt) {
          writingEntriesCache.set(date, legacyEntry);
          await writeWritingEntryToDatabase(legacyEntry);
        }

        window.localStorage.removeItem(key);
      }
    }

    emitWritingStoreChange();
  })().catch((error) => {
    writingHydrationPromise = null;
    console.warn("Failed to hydrate daily writings from IndexedDB", error);
    throw error;
  });

  return writingHydrationPromise;
}

async function fetchWritingEntryFromSupabase(date: string) {
  if (!supabase) {
    return undefined;
  }

  const { data, error } = await supabase
    .from("daily_writings")
    .select(writingEntryColumns)
    .eq("date", date)
    .maybeSingle<WritingEntryRow>();

  if (error) {
    console.warn("Failed to fetch daily writing from Supabase", error.message);
    setWritingSyncStatus(date, {
      status: "error",
      message: "동기화에 실패했습니다",
      updatedAt: new Date().toISOString(),
    });
    return undefined;
  }

  return data ? mapWritingEntryRow(data) : null;
}

async function syncWritingEntryFromSupabase(date: string) {
  if (!isSupabaseConfigured || loadedWritingDates.has(date)) {
    return;
  }

  loadedWritingDates.add(date);

  await hydrateWritingEntries();

  const remoteEntry = await fetchWritingEntryFromSupabase(date);

  if (remoteEntry === undefined) {
    loadedWritingDates.delete(date);
    return;
  }

  if (remoteEntry) {
    const localEntry = readWritingEntry(date);

    if (
      hasWritingContent(localEntry) &&
      (!hasWritingContent(remoteEntry) || localEntry.updatedAt > remoteEntry.updatedAt)
    ) {
      void enqueueSyncOperation("writing-upsert", date, localEntry);
      return;
    }

    writeWritingEntryLocally(date, remoteEntry);
  }
}

async function syncAllWritingEntriesFromSupabase() {
  if (!isSupabaseConfigured || !supabase || loadedAllWritingEntries) {
    return;
  }

  loadedAllWritingEntries = true;
  const client = supabase;

  await hydrateWritingEntries();

  let rows: WritingEntryRow[];

  try {
    rows = await collectSupabasePages<WritingEntryRow>((from, to) =>
      client
        .from("daily_writings")
        .select(writingEntryColumns)
        .order("date", { ascending: false })
        .range(from, to)
        .returns<WritingEntryRow[]>(),
    );
  } catch (error) {
    console.warn("Failed to fetch daily writings from Supabase", error);
    loadedAllWritingEntries = false;
    return;
  }

  rows.forEach((row) => {
    const remoteEntry = mapWritingEntryRow(row);
    const localEntry = readWritingEntry(remoteEntry.date);

    loadedWritingDates.add(remoteEntry.date);

    if (
      hasWritingContent(localEntry) &&
      (!hasWritingContent(remoteEntry) || localEntry.updatedAt > remoteEntry.updatedAt)
    ) {
      void enqueueSyncOperation("writing-upsert", remoteEntry.date, localEntry);
      return;
    }

    writeWritingEntryLocally(remoteEntry.date, remoteEntry);
  });
}

async function persistWritingEntryToSupabase(
  entry: WritingEntry,
): Promise<SupabaseMutationResult> {
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

async function syncRecentWritingSummariesFromSupabase(count: number) {
  if (!supabase) {
    return;
  }

  await hydrateWritingEntries();
  const { data, error } = await supabase
    .from("daily_writings")
    .select("id,date,title,created_at,updated_at")
    .order("date", { ascending: false })
    .limit(count)
    .returns<WritingEntrySummaryRow[]>();

  if (error) {
    console.warn("Failed to fetch recent writing summaries", error.message);
    return;
  }

  (data ?? []).forEach((row) => {
    const current = writingEntriesCache.get(row.date);

    if (!current) {
      writingEntriesCache.set(row.date, {
        id: row.id,
        date: row.date,
        title: row.title?.slice(0, 120) ?? "",
        content: "",
        contentJson: null,
        contentMarkdown: "",
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    }
  });
  emitWritingStoreChange();
}

export async function loadWritingEntry(date: string) {
  await hydrateWritingEntries();
  const remoteEntry = await fetchWritingEntryFromSupabase(date);
  const localEntry = readWritingEntry(date);

  if (remoteEntry) {
    if (
      hasWritingContent(localEntry) &&
      (!hasWritingContent(remoteEntry) || localEntry.updatedAt > remoteEntry.updatedAt)
    ) {
      void enqueueSyncOperation("writing-upsert", date, localEntry);
      return localEntry;
    }

    writeWritingEntryLocally(date, remoteEntry);
    return remoteEntry;
  }

  return localEntry;
}

async function deleteAllWritingEntriesFromSupabase(): Promise<SupabaseMutationResult> {
  if (!supabase) {
    return { ok: true };
  }

  const { error } = await supabase
    .from("daily_writings")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    console.warn("Failed to delete daily writings from Supabase", error.message);
    return { ok: false, message: error.message };
  }

  return { ok: true };
}

export function readWritingEntry(date: string): WritingEntry {
  if (typeof window === "undefined") {
    return createDefaultWritingEntry(date);
  }

  return writingEntriesCache.get(date) ?? readWritingEntryFromLocalStorage(date);
}

function readAllWritingEntries() {
  if (typeof window === "undefined") {
    return [];
  }

  return [...writingEntriesCache.values()].sort((first, second) =>
    second.date.localeCompare(first.date),
  );
}

export function writeWritingEntry(date: string, nextContent: string | WritingEntryDraft) {
  const currentEntry = readWritingEntry(date);
  const now = new Date().toISOString();
  const draft =
    typeof nextContent === "string"
      ? {
          title: currentEntry.title,
          content: nextContent,
          contentJson: null,
          contentMarkdown: nextContent,
        }
      : nextContent;
  const contentMarkdown = draft.contentMarkdown ?? draft.content;
  const nextEntry: WritingEntry = {
    ...currentEntry,
    title: (draft.title ?? currentEntry.title).slice(0, 120),
    content: contentMarkdown,
    contentJson: draft.contentJson ?? null,
    contentMarkdown,
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
    message: "저장 중",
    updatedAt: now,
  });

  void enqueueSyncOperation("writing-upsert", date, nextEntry).then((result) => {
    setWritingSyncStatus(date, {
      status: result.ok ? "saved" : result.queued ? "local-only" : "error",
      message: result.ok ? "저장됨" : result.queued ? "동기화 대기 중" : "저장 실패",
      updatedAt: new Date().toISOString(),
    });
  });
}

export async function writeWritingEntries(entries: WritingEntry[]) {
  const results = await Promise.all(entries.map(async (entry) => {
    const normalizedEntry = normalizeWritingEntry(entry, entry.date);

    writeWritingEntryLocally(normalizedEntry.date, normalizedEntry);
    await writeWritingEntryToDatabase(normalizedEntry);

    if (isSupabaseConfigured) {
      return enqueueSyncOperation("writing-upsert", normalizedEntry.date, normalizedEntry);
    }

    return { ok: true, queued: false };
  }));

  return results;
}

export async function clearAllWritingEntries({ syncRemote = true } = {}) {
  const result = supabase && syncRemote
    ? await replaceDomainWithDeleteOperation(["writing-upsert"], "writing-delete-all")
    : { ok: true, queued: false };

  if (result.ok || result.queued) {
    writingEntriesCache.clear();
    await deleteAllWritingEntriesFromDatabase();
    emitWritingStoreChange();
    broadcastWritingStoreChange();
  }

  return result;
}

function subscribeToWritingEntry(onStoreChange: () => void) {
  const channel =
    typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(writingStoreEventName);
  const handleBroadcast = (event: MessageEvent<{ date?: string }>) => {
    const date = event.data?.date;

    void (async () => {
      if (date && date !== "all") {
        const entry = await readWritingEntryFromDatabase(date);

        if (entry) {
          writingEntriesCache.set(date, normalizeWritingEntry(entry, date));
        }
      } else {
        const entries = await readAllWritingEntriesFromDatabase();
        writingEntriesCache.clear();
        entries.forEach((entry) => writingEntriesCache.set(entry.date, entry));
      }

      writingSnapshotVersion += 1;
      onStoreChange();
    })();
  };

  if (channel) {
    channel.onmessage = handleBroadcast;
  }
  window.addEventListener(writingStoreEventName, onStoreChange);

  return () => {
    channel?.close();
    window.removeEventListener(writingStoreEventName, onStoreChange);
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

  return `${writingSnapshotVersion}:${writingEntriesCache.size}`;
}

function getWritingSyncSnapshot() {
  return `${writingSyncVersion}:${writingSyncStatuses.size}`;
}

function getServerSnapshot() {
  return "server";
}

function readWritingSyncStatus(date: string) {
  return writingSyncStatuses.get(date) ?? defaultWritingSyncStatus;
}

export function useWritingEntry(date = getTodayDateKey()) {
  const snapshot = useSyncExternalStore(
    subscribeToWritingEntry,
    getWritingSnapshot,
    getServerSnapshot,
  );
  useEffect(() => {
    void hydrateWritingEntries().then(() => syncWritingEntryFromSupabase(date));
  }, [date]);

  return snapshot === "server" ? createDefaultWritingEntry(date) : readWritingEntry(date);
}

export function useWritingEntries() {
  const snapshot = useSyncExternalStore(
    subscribeToWritingEntry,
    getWritingSnapshot,
    getServerSnapshot,
  );
  useEffect(() => {
    void hydrateWritingEntries().then(syncAllWritingEntriesFromSupabase);
  }, []);

  return snapshot === "server" ? [] : readAllWritingEntries();
}

export function useWritingSyncStatus(date: string) {
  const snapshot = useSyncExternalStore(
    subscribeToWritingSyncStatus,
    getWritingSyncSnapshot,
    getServerSnapshot,
  );

  return snapshot === "server" ? defaultWritingSyncStatus : readWritingSyncStatus(date);
}

export function useRecentWritingEntries(count: number) {
  const snapshot = useSyncExternalStore(
    subscribeToWritingEntry,
    getWritingSnapshot,
    getServerSnapshot,
  );
  useEffect(() => {
    void syncRecentWritingSummariesFromSupabase(count);
  }, [count]);

  return snapshot === "server" ? [] : readAllWritingEntries().slice(0, count);
}

registerSyncHandler("writing-upsert", (payload) =>
  retrySupabaseMutation(() => persistWritingEntryToSupabase(payload as WritingEntry)),
);
registerSyncHandler("writing-delete-all", () =>
  retrySupabaseMutation(deleteAllWritingEntriesFromSupabase),
);
