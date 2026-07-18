"use client";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";

import type { WritingEntry } from "@/types/writing-entry";

export type SyncOperationKind =
  | "all-delete"
  | "daily-delete-all"
  | "daily-delete-one"
  | "daily-upsert"
  | "templates-sync"
  | "weekly-delete-all"
  | "weekly-upsert"
  | "writing-delete-all"
  | "writing-upsert";

export type SyncQueueRecord = {
  id: string;
  kind: SyncOperationKind;
  entityKey: string;
  payload: unknown;
  createdAt: string;
  version: number;
  attempts: number;
  lastError?: string;
};

interface DailyNoteDatabase extends DBSchema {
  syncQueue: {
    key: string;
    value: SyncQueueRecord;
    indexes: {
      "by-created-at": string;
      "by-kind": SyncOperationKind;
    };
  };
  writingEntries: {
    key: string;
    value: WritingEntry;
    indexes: { "by-updated-at": string };
  };
}

const databaseName = "daily-note-app";
const databaseVersion = 1;
let databasePromise: Promise<IDBPDatabase<DailyNoteDatabase>> | null = null;

function getDatabase() {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB is not available in this browser.");
  }

  databasePromise ??= openDB<DailyNoteDatabase>(databaseName, databaseVersion, {
    upgrade(database) {
      const writingStore = database.createObjectStore("writingEntries", { keyPath: "date" });
      writingStore.createIndex("by-updated-at", "updatedAt");

      const syncStore = database.createObjectStore("syncQueue", { keyPath: "id" });
      syncStore.createIndex("by-created-at", "createdAt");
      syncStore.createIndex("by-kind", "kind");
    },
  });

  return databasePromise;
}

export async function readWritingEntryFromDatabase(date: string) {
  return (await getDatabase()).get("writingEntries", date);
}

export async function readAllWritingEntriesFromDatabase() {
  const entries = await (await getDatabase()).getAllFromIndex("writingEntries", "by-updated-at");
  return entries.sort((first, second) => second.date.localeCompare(first.date));
}

export async function writeWritingEntryToDatabase(entry: WritingEntry) {
  await (await getDatabase()).put("writingEntries", entry);
}

export async function deleteAllWritingEntriesFromDatabase() {
  await (await getDatabase()).clear("writingEntries");
}

export async function putSyncQueueRecord(record: SyncQueueRecord) {
  await (await getDatabase()).put("syncQueue", record);
}

export async function readSyncQueueRecord(id: string) {
  return (await getDatabase()).get("syncQueue", id);
}

export async function readAllSyncQueueRecords() {
  return (await getDatabase()).getAllFromIndex("syncQueue", "by-created-at");
}

export async function deleteSyncQueueRecord(id: string) {
  await (await getDatabase()).delete("syncQueue", id);
}

export async function deleteSyncQueueRecordsByKinds(kinds: SyncOperationKind[]) {
  const database = await getDatabase();
  const transaction = database.transaction("syncQueue", "readwrite");
  const records = await transaction.store.getAll();

  await Promise.all(
    records
      .filter((record) => kinds.includes(record.kind))
      .map((record) => transaction.store.delete(record.id)),
  );
  await transaction.done;
}

export async function resetClientDatabaseForTests() {
  if (databasePromise) {
    (await databasePromise).close();
    databasePromise = null;
  }

  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(databaseName);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("IndexedDB reset was blocked."));
  });
}
