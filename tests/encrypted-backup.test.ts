import { describe, expect, it } from "vitest";

import { isEncryptedDailyNoteBackup } from "@/lib/encrypted-backup";

const validEncryptedBackup = {
  app: "daily-note-app-encrypted",
  version: 1,
  algorithm: "AES-GCM",
  iterations: 310_000,
  salt: "AAAAAAAAAAAAAAAAAAAAAA==",
  iv: "AAAAAAAAAAAAAAAA",
  ciphertext: "AAAAAAAAAAAAAAAAAAAAAA==",
};

describe("encrypted backup envelope", () => {
  it("accepts the format produced by the app", () => {
    expect(isEncryptedDailyNoteBackup(validEncryptedBackup)).toBe(true);
  });

  it("rejects attacker-controlled KDF work factors outside the safe range", () => {
    expect(
      isEncryptedDailyNoteBackup({ ...validEncryptedBackup, iterations: 1 }),
    ).toBe(false);
    expect(
      isEncryptedDailyNoteBackup({ ...validEncryptedBackup, iterations: 10_000_001 }),
    ).toBe(false);
  });

  it("rejects malformed or undersized encrypted fields", () => {
    expect(isEncryptedDailyNoteBackup({ ...validEncryptedBackup, salt: "not-base64" })).toBe(false);
    expect(isEncryptedDailyNoteBackup({ ...validEncryptedBackup, ciphertext: "AAAA" })).toBe(false);
  });
});
