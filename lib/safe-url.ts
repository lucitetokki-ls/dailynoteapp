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

  try {
    const url = new URL(href, linkBaseUrl);

    return allowedLinkProtocols.has(url.protocol) ? href : null;
  } catch {
    return null;
  }
}
