import { beforeEach, describe, expect, it } from "vitest";

import {
  putSyncQueueRecord,
  readAllSyncQueueRecords,
  readAllWritingEntriesFromDatabase,
  resetClientDatabaseForTests,
  writeWritingEntryToDatabase,
} from "@/lib/client-db";

describe("client database", () => {
  beforeEach(async () => {
    await resetClientDatabaseForTests();
  });

  it("stores long writing entries outside localStorage", async () => {
    await writeWritingEntryToDatabase({
      id: "writing-1",
      date: "2026-07-18",
      title: "IndexedDB",
      content: "가".repeat(100_000),
      contentMarkdown: "가".repeat(100_000),
      contentJson: null,
      createdAt: "2026-07-18T00:00:00.000Z",
      updatedAt: "2026-07-18T01:00:00.000Z",
    });

    const entries = await readAllWritingEntriesFromDatabase();
    expect(entries).toHaveLength(1);
    expect(entries[0].content).toHaveLength(100_000);
  });

  it("replaces a queued operation with the latest payload", async () => {
    const base = {
      id: "daily-upsert:2026-07-18",
      kind: "daily-upsert" as const,
      entityKey: "2026-07-18",
      createdAt: "2026-07-18T00:00:00.000Z",
      version: 1,
      attempts: 0,
    };

    await putSyncQueueRecord({ ...base, payload: { revision: 1 } });
    await putSyncQueueRecord({ ...base, payload: { revision: 2 } });

    const records = await readAllSyncQueueRecords();
    expect(records).toHaveLength(1);
    expect(records[0].payload).toEqual({ revision: 2 });
  });
});
