/**
 * Where to send someone after sign-in when the page that sent them asked to come back. Only the
 * invitation page may ask; anything else is ignored so the sign-in screen can never be used to
 * redirect people to another address.
 */
export function safeNext(value: string | string[] | undefined | null): string | undefined {
  const next = Array.isArray(value) ? value[0] : value;
  return typeof next === "string" && /^\/manufacturer\/join\/[0-9a-f]{20,64}$/.test(next) ? next : undefined;
}
