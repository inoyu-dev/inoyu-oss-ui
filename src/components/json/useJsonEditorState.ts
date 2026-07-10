/**
 * useJsonEditorState — Manages the JSON string ↔ parsed object synchronisation
 * needed when pairing a JsonEditor with an external state object.
 *
 * DRY: This pattern was previously copy-pasted across GoalBuilder,
 * CampaignBuilder, ScoringBuilder, RuleBuilder, and others.
 *
 * Usage:
 *   const [json, setJson, parsed] = useJsonEditorState<Condition>(externalValue);
 *
 *   <JsonEditor value={json} onChange={setJson} />
 *   // `parsed` is updated whenever `json` is valid JSON
 *
 * The hook is resilient to "echo-back": if a parent calls onChange(parsed),
 * stores the result, and passes it back as externalValue, the hook detects
 * that the serialised form is unchanged and skips the re-sync — preventing
 * cursor jumps and re-formatting the user's text.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export function useJsonEditorState<T>(
  externalValue: T | undefined
): [string, (val: string) => void, T | undefined] {
  const [jsonString, setJsonString] = useState(() =>
    externalValue !== undefined ? JSON.stringify(externalValue, null, 2) : ''
  );
  const [parsed, setParsed] = useState<T | undefined>(externalValue);

  // Ref tracking the last serialised form we produced internally, so we can
  // detect "echo-back" from the parent and skip the re-sync.
  const lastParsedJsonRef = useRef<string>(
    externalValue !== undefined ? JSON.stringify(externalValue, null, 2) : ''
  );

  // Sync from external → local whenever the external value changes
  // (e.g. when a dialog opens with a pre-populated object, or when
  // the parent switches from one entity to another).
  useEffect(() => {
    const externalJson =
      externalValue !== undefined ? JSON.stringify(externalValue, null, 2) : '';

    // Skip if this is just the parent echoing back our own parsed output
    if (externalJson === lastParsedJsonRef.current) return;

    lastParsedJsonRef.current = externalJson;
    setJsonString(externalJson);
    setParsed(externalValue);
  }, [externalValue]);

  const handleChange = useCallback((val: string) => {
    setJsonString(val);
    try {
      const obj = JSON.parse(val) as T;
      setParsed(obj);
      // Track the serialised form so we can detect echo-back
      lastParsedJsonRef.current = JSON.stringify(obj, null, 2);
    } catch {
      // Invalid JSON — keep editing without updating parsed
    }
  }, []);

  return [jsonString, handleChange, parsed];
}
