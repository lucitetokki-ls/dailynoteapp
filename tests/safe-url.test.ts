import { describe, expect, it } from "vitest";

import { getSafeLinkHref } from "@/lib/safe-url";

describe("safe link URLs", () => {
  it("allows the supported explicit protocols", () => {
    expect(getSafeLinkHref("https://example.com/notes")).toBe("https://example.com/notes");
    expect(getSafeLinkHref("mailto:hello@example.com")).toBe("mailto:hello@example.com");
    expect(getSafeLinkHref("tel:+821012345678")).toBe("tel:+821012345678");
  });

  it("rejects executable, protocol-relative, and credential-bearing URLs", () => {
    expect(getSafeLinkHref("javascript:alert(1)")).toBeNull();
    expect(getSafeLinkHref("//example.com/redirect")).toBeNull();
    expect(getSafeLinkHref("https://user:password@example.com")).toBeNull();
  });
});
