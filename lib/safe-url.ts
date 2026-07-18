const allowedLinkProtocols = new Set(["http:", "https:", "mailto:", "tel:"]);
const linkBaseUrl = "https://daily-note.invalid";

export function getSafeLinkHref(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const href = value.trim();

  if (!href || /[\u0000-\u001f\u007f]/.test(href)) {
    return null;
  }

  if (href.startsWith("//")) {
    return null;
  }

  try {
    const url = new URL(href, linkBaseUrl);

    if (
      !allowedLinkProtocols.has(url.protocol) ||
      url.username ||
      url.password ||
      ((url.protocol === "http:" || url.protocol === "https:") && !url.hostname)
    ) {
      return null;
    }

    return href;
  } catch {
    return null;
  }
}
