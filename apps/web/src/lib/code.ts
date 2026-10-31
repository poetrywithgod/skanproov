/**
 * Turns whatever a scan or a typed entry produced into a product code, or null.
 *
 * Accepts:
 *  - the 12-digit backup PIN, with or without spaces/dashes ("1234 5678 9012")
 *  - a bare code ("ABC123")
 *  - a URL whose last path segment is the code ("https://skanproov.com/v/ABC123")
 *
 * Only the code is ever used. The host of a scanned URL is ignored on purpose, so a
 * scanned QR can never send anyone to another site; a code from a fake QR simply
 * fails to verify.
 */
export function extractCode(raw: string): string | null {
  const text = raw.trim();
  if (!text || text.length > 2048) return null;

  let candidate = text;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(text)) {
    try {
      const url = new URL(text);
      const segments = url.pathname.split("/").filter(Boolean);
      candidate = url.searchParams.get("c") ?? url.searchParams.get("code") ?? segments.at(-1) ?? "";
    } catch {
      return null;
    }
  }

  // Backup PINs are shown in groups; strip the separators.
  const compact = candidate.replace(/[\s-]/g, "");
  if (/^\d{12}$/.test(compact)) return compact;

  return /^[A-Za-z0-9_-]{4,64}$/.test(candidate) ? candidate : null;
}

/** "123456789012" -> "1234 5678 9012" for display and input. */
export function formatPin(digits: string): string {
  return digits.replace(/\D/g, "").slice(0, 12).replace(/(\d{4})(?=\d)/g, "$1 ");
}
