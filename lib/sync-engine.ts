"use client";

import {
  deleteSyncQueueRecord,
  deleteSyncQueueRecordsByKinds,
  putSyncQueueRecord,
  readAllSyncQueueRecords,
  readSyncQueueRecord,
  type SyncOperationKind,
  type SyncQueueRecord,
} from "@/lib/client-db";
import type { SupabaseMutationResult } from "@/lib/supabase";

export type DurableSyncResult = SupabaseMutationResult & { queued: boolean };
type SyncHandler = (payload: unknown) => Promise<SupabaseMutationResult>;

const handlers = new Map<SyncOperationKind, SyncHandler>();
let flushPromise: Promise<void> | null = null;
let onlineListenerInstalled = false;
const recordRuns = new Map<string, Promise<DurableSyncResult>>();

function isOnline() {
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function runRecord(record: SyncQueueRecord): Promise<DurableSyncResult> {
  const handler = handlers.get(record.kind);

  if (!handler || !isOnline()) {
    return { ok: false, queued: true, message: "동기화 대기 중" };
  }

  try {
    const result = await handler(record.payload);
    const current = await readSyncQueueRecord(record.id);

    if (result.ok) {
      if (current?.version === record.version) {
        await deleteSyncQueueRecord(record.id);
      }
      return { ...result, queued: false };
    }

    if (current?.version === record.version) {
      await putSyncQueueRecord({
        ...record,
        attempts: record.attempts + 1,
        lastError: result.message,
      });
    }
    return { ...result, queued: true };
  } catch (error) {
    const message = getErrorMessage(error);
    const current = await readSyncQueueRecord(record.id);
    if (current?.version === record.version) {
      await putSyncQueueRecord({
        ...record,
        attempts: record.attempts + 1,
        lastError: message,
      });
    }
    return { ok: false, queued: true, message };
  }
}

async function runLatestRecord(id: string): Promise<DurableSyncResult> {
  const previous = recordRuns.get(id);
  const next = (previous ?? Promise.resolve({ ok: true, queued: false }))
    .catch(() => ({ ok: false, queued: true }))
    .then(async () => {
      const latest = await readSyncQueueRecord(id);
      return latest ? runRecord(latest) : { ok: true, queued: false };
    });

  recordRuns.set(id, next);
  try {
    return await next;
  } finally {
    if (recordRuns.get(id) === next) {
      recordRuns.delete(id);
    }
  }
}

export function registerSyncHandler(kind: SyncOperationKind, handler: SyncHandler) {
  handlers.set(kind, handler);
  installOnlineSyncListener();
  if (typeof window !== "undefined") {
    void flushSyncQueue();
  }

  return () => {
    if (handlers.get(kind) === handler) {
      handlers.delete(kind);
    }
  };
}

export async function enqueueSyncOperation(
  kind: SyncOperationKind,
  entityKey: string,
  payload: unknown,
): Promise<DurableSyncResult> {
  const id = `${kind}:${entityKey}`;
  const existing = await readSyncQueueRecord(id);
  const record: SyncQueueRecord = {
    id,
    kind,
    entityKey,
    payload,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    version: (existing?.version ?? 0) + 1,
    attempts: existing?.attempts ?? 0,
  };

  await putSyncQueueRecord(record);
  return runLatestRecord(id);
}

export async function replaceDomainWithDeleteOperation(
  kindsToReplace: SyncOperationKind[],
  deleteKind: SyncOperationKind,
) {
  await deleteSyncQueueRecordsByKinds(kindsToReplace);
  return enqueueSyncOperation(deleteKind, "all", null);
}

export function discardSyncOperation(kind: SyncOperationKind, entityKey: string) {
  return deleteSyncQueueRecord(`${kind}:${entityKey}`);
}

export async function flushSyncQueue() {
  if (flushPromise) {
    return flushPromise;
  }

  flushPromise = (async () => {
    if (!isOnline()) {
      return;
    }

    const records = await readAllSyncQueueRecords();

    for (const record of records) {
      await runLatestRecord(record.id);
    }
  })().finally(() => {
    flushPromise = null;
  });

  return flushPromise;
}

export function installOnlineSyncListener() {
  if (typeof window === "undefined" || onlineListenerInstalled) {
    return;
  }

  onlineListenerInstalled = true;
  window.addEventListener("online", () => {
    void flushSyncQueue();
  });
}
