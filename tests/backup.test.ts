import { describe, expect, it } from "vitest";

import { parseDailyNoteBackup } from "@/lib/backup";

const timestamp = "2026-07-18T00:00:00.000Z";

function createBackup() {
  return {
    app: "daily-note-app",
    version: 3,
    exportedAt: timestamp,
    days: [],
    writingEntries: [
      {
        id: "01800000-0000-7000-8000-000000000001",
        date: "2026-07-18",
        title: "첫 글",
        content: "본문",
        contentMarkdown: "본문",
        contentJson: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    templates: [],
    weeklyReflections: [],
  };
}

describe("backup parser", () => {
  it("accepts a valid backup", () => {
    expect(parseDailyNoteBackup(createBackup()).writingEntries).toHaveLength(1);
  });

  it("rejects duplicate writing dates", () => {
    const backup = createBackup();
    backup.writingEntries.push({
      ...backup.writingEntries[0],
      id: "01800000-0000-7000-8000-000000000002",
    });

    expect(() => parseDailyNoteBackup(backup)).toThrow("writingEntries.date");
  });

  it("rejects an action whose slot and category do not match", () => {
    const backup = createBackup();
    backup.days = [
      {
        dailyLog: {
          id: "01800000-0000-7000-8000-000000000010",
          date: "2026-07-18",
          dailyMood: "steady",
          dailyReflection: "",
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        actions: [
          {
            id: "01800000-0000-7000-8000-000000000011",
            dailyLogId: "01800000-0000-7000-8000-000000000010",
            slot: "diet",
            category: "writing",
            title: "잘못된 카테고리",
            description: "",
            status: "done",
            satisfaction: 3,
            reflection: "",
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ],
      },
    ];

    expect(() => parseDailyNoteBackup(backup)).toThrow("days[0].actions[0].category");
  });
});
