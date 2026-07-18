import { beforeEach, describe, expect, it, vi } from "vitest";

import { readAllSyncQueueRecords, resetClientDatabaseForTests } from "@/lib/client-db";
import { enqueueSyncOperation, registerSyncHandler } from "@/lib/sync-engine";

describe("durable sync engine", () => {
  beforeEach(async () => {
    await resetClientDatabaseForTests();
  });

  it("serializes rapid updates and keeps the newest payload last", async () => {
    const payloads: unknown[] = [];
    const releases: Array<() => void> = [];
    const unregister = registerSyncHandler("daily-upsert", async (payload) => {
      payloads.push(payload);
      await new Promise<void>((resolve) => releases.push(resolve));
      return { ok: true };
    });

    const first = enqueueSyncOperation("daily-upsert", "2026-07-18", { revision: 1 });
    await vi.waitFor(() => expect(releases).toHaveLength(1));
    const second = enqueueSyncOperation("daily-upsert", "2026-07-18", { revision: 2 });
    await vi.waitFor(async () => {
      const records = await readAllSyncQueueRecords();
      expect(records[0]?.version).toBe(2);
    });

    releases[0]();
    await vi.waitFor(() => expect(releases).toHaveLength(2));
    releases[1]();
    await Promise.all([first, second]);

    expect(payloads).toEqual([{ revision: 1 }, { revision: 2 }]);
    expect(await readAllSyncQueueRecords()).toHaveLength(0);
    unregister();
  });
});
