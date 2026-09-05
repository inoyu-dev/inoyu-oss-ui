/**
 * Unomi version helpers for live Playwright e2e.
 * Tenant APIs/UI exist only on Unomi 3.1+.
 */

export function parseUnomiVersion(
  raw = process.env.UNOMI_VERSION || '3.1'
): { major: number; minor: number } {
  const match = String(raw).trim().match(/^(\d+)(?:\.(\d+))?/);
  if (!match) {
    return { major: 3, minor: 1 };
  }
  return { major: Number(match[1]), minor: Number(match[2] || 0) };
}

/** True when the e2e stack is Unomi 3.1 or newer. */
export function e2eSupportsTenants(): boolean {
  const { major, minor } = parseUnomiVersion();
  if (major !== 3) {
    return major > 3;
  }
  return minor >= 1;
}
