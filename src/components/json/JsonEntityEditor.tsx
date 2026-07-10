/**
 * JsonEntityEditor — Enhanced JSON editor with toolbar, validation status,
 * and error list. Wraps the base JsonEditor for entity-specific editing.
 *
 * Used as the foundation for JsonConditionEditor, JsonActionEditor, etc.
 * Each specialized editor pre-configures the schema and entity label.
 *
 * Features:
 * - Format JSON button
 * - Copy to clipboard button
 * - Valid/invalid status indicator with error count
 * - Optional inline error list
 * - Echo-back–safe: passing onChange results back via `value` won't
 *   cause cursor jumps or infinite loops.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, CheckCircle2, AlertCircle, Code } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import JsonEditor from './JsonEditor';
import type { MonacoMarker } from './JsonEditor';
import { formatJson } from './format-json';

export interface JsonEntityEditorProps<T> {
  /** The parsed object value (managed externally) */
  value: T | undefined;
  /** Called with the parsed object whenever valid JSON is entered */
  onChange?: (value: T) => void;
  /** JSON Schema for validation and autocompletion */
  schema?: Record<string, unknown>;
  /** Schema URI (must be unique per editor instance on the page) */
  schemaUri?: string;
  /** Editor height (CSS value or px number). Default 300 */
  height?: string | number;
  /** Make the editor read-only */
  readOnly?: boolean;
  /** Show the error list below the editor. Default true */
  showErrors?: boolean;
  /** Show the toolbar. Default true */
  showToolbar?: boolean;
  /** Extra CSS class on the wrapper */
  className?: string;
}

export function JsonEntityEditor<T>({
  value,
  onChange,
  schema,
  schemaUri,
  height = 300,
  readOnly = false,
  showErrors = true,
  showToolbar = true,
  className = '',
}: JsonEntityEditorProps<T>) {
  const { t } = useTranslation();
  const [markers, setMarkers] = useState<MonacoMarker[]>([]);
  const isValid = markers.length === 0;

  // ---- Internal JSON string state -------------------------------------------
  const [jsonString, setJsonString] = useState(() =>
    value !== undefined ? JSON.stringify(value, null, 2) : ''
  );

  // Track the last serialised value we know about (either from external or
  // internal edits) so we can detect echo-back and skip unnecessary re-syncs.
  const lastKnownJsonRef = useRef(
    value !== undefined ? JSON.stringify(value, null, 2) : ''
  );

  // Sync from external value (e.g. switching entities, initial load)
  useEffect(() => {
    const externalJson =
      value !== undefined ? JSON.stringify(value, null, 2) : '';

    // Skip if this is just the parent echoing back our own onChange result
    if (externalJson === lastKnownJsonRef.current) return;

    lastKnownJsonRef.current = externalJson;
    setJsonString(externalJson);
  }, [value]);

  // User typing handler — updates local string and notifies parent on valid JSON
  const handleChange = useCallback(
    (val: string) => {
      setJsonString(val);
      try {
        const obj = JSON.parse(val) as T;
        lastKnownJsonRef.current = JSON.stringify(obj, null, 2);
        onChange?.(obj);
      } catch {
        // Invalid JSON — keep editing, don't notify parent
      }
    },
    [onChange]
  );

  // ---- Validation -----------------------------------------------------------
  const handleValidate = useCallback((newMarkers: MonacoMarker[]) => {
    setMarkers(newMarkers);
  }, []);

  // ---- Toolbar actions ------------------------------------------------------
  const handleFormat = useCallback(() => {
    const result = formatJson(jsonString);
    if (result.ok) {
      setJsonString(result.formatted);
      lastKnownJsonRef.current = result.formatted;
    }
  }, [jsonString]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(jsonString);
  }, [jsonString]);

  return (
    <div className={`space-y-2 ${className}`}>
      {showToolbar && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {jsonString.trim() && (
              <>
                {isValid ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm text-muted-foreground">
                  {isValid
                    ? t('Valid JSON')
                    : `${markers.length} ${t('error')}${markers.length > 1 ? 's' : ''}`}
                </span>
              </>
            )}
          </div>
          <div className="flex gap-2">
            {!readOnly && (
              <Button variant="outline" size="sm" onClick={handleFormat}>
                <Code className="h-4 w-4 mr-1" />
                {t('Format')}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-1" />
              {t('Copy')}
            </Button>
          </div>
        </div>
      )}

      <JsonEditor
        value={jsonString}
        onChange={readOnly ? undefined : handleChange}
        schema={schema}
        schemaUri={schemaUri}
        height={height}
        readOnly={readOnly}
        onValidate={handleValidate}
      />

      {showErrors && markers.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {markers.slice(0, 5).map((marker, idx) => (
                <li key={idx}>
                  {t('Line')} {marker.startLineNumber}: {marker.message}
                </li>
              ))}
              {markers.length > 5 && (
                <li className="text-muted-foreground">
                  ...{t('and')} {markers.length - 5} {t('more')}
                </li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
