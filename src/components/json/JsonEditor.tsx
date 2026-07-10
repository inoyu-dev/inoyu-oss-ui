/**
 * JsonEditor — Base Monaco Editor component for JSON editing.
 *
 * Features:
 * - Syntax highlighting, folding, auto-formatting
 * - Real-time JSON syntax validation with error markers
 * - Optional JSON Schema validation (Unomi schemas, custom schemas)
 * - Read-only mode for JSON viewers
 * - Dark/light theme auto-detection with custom Unomi UI themes
 * - Context-aware autocompletion for Unomi types, operators, properties
 * - Hover documentation for condition/action types
 * - Lazy-loaded (no SSR) — Monaco is ~2 MB and loaded from CDN
 *
 * Usage:
 *   <JsonEditor value={jsonString} onChange={setJsonString} />
 *   <JsonEditor value={jsonString} readOnly schema={mySchema} />
 */

import React, { useRef, useCallback, useId } from 'react';
import dynamic from 'next/dynamic';
import type { OnMount } from '@monaco-editor/react';
import type { editor, Uri } from 'monaco-editor';
import { useTheme } from '@/contexts/ThemeContext';
import { registerUnomiCompletions, registerUnomiHoverProvider } from './unomi-completions';
import { registerUnomiThemes } from './monaco-themes';

// Lazy-load Monaco to avoid SSR issues and reduce initial bundle size
const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center border border-border rounded-md bg-muted/30 text-sm text-muted-foreground"
      style={{ minHeight: 200 }}
    >
      Loading editor…
    </div>
  ),
});

export interface JsonEditorProps {
  /** JSON string to display/edit */
  value: string;
  /** Called with the new string value on every keystroke */
  onChange?: (value: string) => void;
  /** Optional JSON Schema (draft-07) for validation/autocomplete */
  schema?: Record<string, unknown>;
  /** URI used to identify the schema (must be unique per editor instance) */
  schemaUri?: string;
  /** Editor height — CSS value or number (px). Default 400 */
  height?: string | number;
  /** Make the editor read-only */
  readOnly?: boolean;
  /** Show minimap. Default false */
  showMinimap?: boolean;
  /** Override theme. Default auto-detected from ThemeContext */
  theme?: 'vs' | 'vs-dark' | 'unomi-light' | 'unomi-dark';
  /** Extra CSS classes on the wrapper div */
  className?: string;
  /** Callback when Monaco validation markers change */
  onValidate?: (markers: MonacoMarker[]) => void;
}

/** Simplified marker type exposed to consumers */
export interface MonacoMarker {
  startLineNumber: number;
  endLineNumber: number;
  startColumn: number;
  endColumn: number;
  message: string;
  severity: number;
}

export default function JsonEditor({
  value,
  onChange,
  schema,
  schemaUri,
  height = 400,
  readOnly = false,
  showMinimap = false,
  theme: themeProp,
  className = '',
  onValidate,
}: JsonEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // Stable per-instance model path so multiple JsonEditors don't share a
  // single Monaco model (which would cause schema conflicts with fileMatch).
  const instanceId = useId();
  const modelPath = schemaUri
    ? `inmemory://unomi-ui/${schemaUri.replace(/[^a-zA-Z0-9_/-]/g, '_')}.json`
    : `inmemory://unomi-ui/editor${instanceId.replace(/:/g, '_')}.json`;

  // Auto-detect theme from ThemeContext (always called — hooks must be unconditional)
  // Uses custom Unomi UI themes (registered on mount) instead of built-in vs/vs-dark
  const { resolvedTheme } = useTheme();
  const editorTheme = themeProp ?? (resolvedTheme === 'dark' ? 'unomi-dark' : 'unomi-light');

  // -----------------------------------------------------------------------
  // Mount handler — configure JSON language, schemas, and validation
  // -----------------------------------------------------------------------
  const handleMount: OnMount = useCallback(
    (editorInstance, monacoInstance) => {
      editorRef.current = editorInstance;

      // Register Unomi UI custom themes + autocompletion/hover (idempotent)
      registerUnomiThemes(monacoInstance);
      registerUnomiCompletions(monacoInstance);
      registerUnomiHoverProvider(monacoInstance);

      // Configure JSON defaults with optional schema.
      // Each editor uses its own `modelPath` as the `fileMatch` so schemas
      // don't bleed between multiple JsonEditor instances on the same page.
      const schemas: { uri: string; fileMatch: string[]; schema: Record<string, unknown> }[] = [];
      if (schema) {
        const resolvedUri = schemaUri || 'http://unomi-ui/schemas/inline.json';
        const model = editorInstance.getModel();
        const matchPattern = model ? model.uri.toString() : '*';
        schemas.push({
          uri: resolvedUri,
          fileMatch: [matchPattern],
          schema,
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (monacoInstance.languages.json as any).jsonDefaults.setDiagnosticsOptions({
        validate: true,
        allowComments: false,
        trailingCommas: 'error',
        schemas,
      });

      // Forward validation markers to consumer
      if (onValidate) {
        monacoInstance.editor.onDidChangeMarkers((uris: readonly Uri[]) => {
          const model = editorInstance.getModel();
          if (model && uris.some((uri) => uri.toString() === model.uri.toString())) {
            const markers = monacoInstance.editor.getModelMarkers({
              resource: model.uri,
            });
            onValidate(markers as MonacoMarker[]);
          }
        });
      }
    },
    [schema, schemaUri, onValidate]
  ) as OnMount;

  // -----------------------------------------------------------------------
  // Change handler
  // -----------------------------------------------------------------------
  const handleChange = useCallback(
    (newValue: string | undefined) => {
      if (onChange && newValue !== undefined) {
        onChange(newValue);
      }
    },
    [onChange]
  );

  return (
    <div className={`json-editor overflow-hidden rounded-md border border-border ${className}`}>
      <Editor
        height={height}
        language="json"
        path={modelPath}
        theme={editorTheme}
        value={value}
        onChange={handleChange}
        onMount={handleMount}
        options={{
          readOnly,
          minimap: { enabled: showMinimap },
          fontSize: 13,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          formatOnPaste: true,
          formatOnType: true,
          wordWrap: 'on',
          folding: true,
          showFoldingControls: 'mouseover',
          renderLineHighlight: 'line',
          guides: { bracketPairs: true },
          padding: { top: 8, bottom: 8 },
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
        }}
      />
    </div>
  );
}
