'use strict';

/**
 * Env for Playwright webServer / workers.
 * Never pass NO_COLOR alongside FORCE_COLOR (Node emits a warning).
 * Drops undefined values so Playwright's env map stays string-only.
 */
function playwrightChildEnv(overrides = {}) {
  const merged = { ...process.env, ...overrides };
  delete merged.NO_COLOR;
  if (merged.FORCE_COLOR === undefined || merged.FORCE_COLOR === '') {
    merged.FORCE_COLOR = '0';
  }
  const env = {};
  for (const [key, value] of Object.entries(merged)) {
    if (value !== undefined) {
      env[key] = value;
    }
  }
  return env;
}

module.exports = { playwrightChildEnv };
