import { describe, expect, it } from "vitest";

import { isLegacySampleDay } from "@/lib/sample-data";

describe("legacy sample data detection", () => {
  it("detects the generated May sample records", () => {
    expect(
      isLegacySampleDay({
        dailyLog: { date: "2026-05-03" },
        actions: [{ createdAt: "2026-05-07T13:55:48.385Z" }],
      }),
    ).toBe(true);
  });

  it("preserves user-created records in the same date range", () => {
    expect(
      isLegacySampleDay({
        dailyLog: { date: "2026-05-03" },
        actions: [{ createdAt: "2026-05-07T13:55:49.000Z" }],
      }),
    ).toBe(false);
  });

  it("preserves empty and unrelated records", () => {
    expect(isLegacySampleDay({ dailyLog: { date: "2026-05-05" }, actions: [] })).toBe(false);
    expect(
      isLegacySampleDay({
        dailyLog: { date: "2026-07-18" },
        actions: [{ createdAt: "2026-05-07T13:55:48.385Z" }],
      }),
    ).toBe(false);
  });
});
