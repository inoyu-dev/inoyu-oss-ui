/**
 * formatJson — Parse and re-stringify JSON with pretty-print indentation.
 *
 * Returns the formatted string on success, or an error message on failure.
 * DRY: Extracted from identical handlers in JsonSchemaEditor and EventValidator.
 */
export function formatJson(text: string): { ok: true; formatted: string } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(text);
    return { ok: true, formatted: JSON.stringify(parsed, null, 2) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Invalid JSON' };
  }
}
