/**
 * Unomi version helpers for live Playwright e2e.
 * Tenant APIs/UI exist only on Unomi 4.0+.
 */

export function parseUnomiVersion(
  raw = process.env.UNOMI_VERSION || '4.0'
): { major: number; minor: number } {
  const match = String(raw).trim().match(/^(\d+)(?:\.(\d+))?/);
  if (!match) {
    return { major: 0, minor: 0 };
  }
  return { major: Number(match[1]), minor: Number(match[2] || 0) };
}

/** True when the e2e stack is Unomi 4.0 or newer. */
export function e2eSupportsTenants(): boolean {
  const { major } = parseUnomiVersion();
  return major >= 4;
}
