/**
 * Custom Monaco Editor themes for Unomi UI.
 *
 * Two themes:
 * - `unomi-light` — Light mode with navy-blue accents
 * - `unomi-dark`  — Dark mode with blue-cyan accents
 *
 * Color palette derived from the app's CSS custom properties:
 * - Primary: #152a4c (navy blue)
 * - Accent: #338cf5 (bright blue)
 * - Background: #f8fafc (light) / #0f172a (dark)
 * - Foreground: #1e293b (light) / #f1f5f9 (dark)
 *
 * Registered once via `registerUnomiThemes()`.
 */

import type { editor } from 'monaco-editor';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Monaco = any;

let registered = false;

// ─── Light Theme ────────────────────────────────────────────────────────────

const UNOMI_LIGHT: editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  rules: [
    // JSON keys — primary navy
    { token: 'string.key.json', foreground: '152a4c', fontStyle: 'bold' },
    // JSON string values — teal
    { token: 'string.value.json', foreground: '0d7377' },
    // Numbers — accent blue
    { token: 'number', foreground: '2563eb' },
    { token: 'number.json', foreground: '2563eb' },
    // Booleans and null — purple
    { token: 'keyword', foreground: '7c3aed' },
    { token: 'keyword.json', foreground: '7c3aed' },
    // Brackets/punctuation — softer gray
    { token: 'delimiter.bracket.json', foreground: '64748b' },
    { token: 'delimiter.colon.json', foreground: '64748b' },
    { token: 'delimiter.comma.json', foreground: '94a3b8' },
    // Comments (for future use)
    { token: 'comment', foreground: '94a3b8', fontStyle: 'italic' },
  ],
  colors: {
    // Editor background and foreground
    'editor.background': '#f8fafc',
    'editor.foreground': '#1e293b',

    // Active line highlight
    'editor.lineHighlightBackground': '#e2e8f020',
    'editor.lineHighlightBorder': '#e2e8f040',

    // Selection
    'editor.selectionBackground': '#338cf530',
    'editor.inactiveSelectionBackground': '#338cf515',
    'editor.selectionHighlightBackground': '#338cf520',

    // Find match highlights
    'editor.findMatchBackground': '#fbbf2450',
    'editor.findMatchHighlightBackground': '#fbbf2425',

    // Cursor
    'editorCursor.foreground': '#338cf5',

    // Line numbers
    'editorLineNumber.foreground': '#94a3b8',
    'editorLineNumber.activeForeground': '#475569',

    // Indent guides
    'editorIndentGuide.background': '#e2e8f0',
    'editorIndentGuide.activeBackground': '#94a3b8',

    // Bracket matching
    'editorBracketMatch.background': '#338cf520',
    'editorBracketMatch.border': '#338cf580',

    // Widget (autocomplete dropdown)
    'editorWidget.background': '#ffffff',
    'editorWidget.border': '#e2e8f0',
    'editorWidget.foreground': '#1e293b',
    'editorSuggestWidget.background': '#ffffff',
    'editorSuggestWidget.border': '#e2e8f0',
    'editorSuggestWidget.selectedBackground': '#338cf515',
    'editorSuggestWidget.highlightForeground': '#338cf5',

    // Hover widget
    'editorHoverWidget.background': '#ffffff',
    'editorHoverWidget.border': '#e2e8f0',

    // Scrollbar
    'scrollbar.shadow': '#00000010',
    'scrollbarSlider.background': '#94a3b830',
    'scrollbarSlider.hoverBackground': '#94a3b850',
    'scrollbarSlider.activeBackground': '#64748b50',

    // Error/warning squiggles
    'editorError.foreground': '#ef4444',
    'editorWarning.foreground': '#f59e0b',
    'editorInfo.foreground': '#338cf5',

    // Minimap
    'minimap.background': '#f8fafc',

    // Gutter (fold controls)
    'editorGutter.background': '#f8fafc',
    'editorGutter.foldingControlForeground': '#94a3b8',

    // Overview ruler (right edge markers)
    'editorOverviewRuler.errorForeground': '#ef4444',
    'editorOverviewRuler.warningForeground': '#f59e0b',
    'editorOverviewRuler.infoForeground': '#338cf5',
  },
};

// ─── Dark Theme ─────────────────────────────────────────────────────────────

const UNOMI_DARK: editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    // JSON keys — bright cyan-blue
    { token: 'string.key.json', foreground: '7dd3fc', fontStyle: 'bold' },
    // JSON string values — warm amber
    { token: 'string.value.json', foreground: 'fbbf24' },
    // Numbers — bright blue
    { token: 'number', foreground: '60a5fa' },
    { token: 'number.json', foreground: '60a5fa' },
    // Booleans and null — purple
    { token: 'keyword', foreground: 'c084fc' },
    { token: 'keyword.json', foreground: 'c084fc' },
    // Brackets/punctuation — muted slate
    { token: 'delimiter.bracket.json', foreground: '94a3b8' },
    { token: 'delimiter.colon.json', foreground: '94a3b8' },
    { token: 'delimiter.comma.json', foreground: '64748b' },
    // Comments
    { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
  ],
  colors: {
    // Editor background and foreground
    'editor.background': '#0f172a',
    'editor.foreground': '#f1f5f9',

    // Active line highlight
    'editor.lineHighlightBackground': '#1e293b60',
    'editor.lineHighlightBorder': '#1e293b80',

    // Selection
    'editor.selectionBackground': '#338cf540',
    'editor.inactiveSelectionBackground': '#338cf520',
    'editor.selectionHighlightBackground': '#338cf525',

    // Find match
    'editor.findMatchBackground': '#fbbf2440',
    'editor.findMatchHighlightBackground': '#fbbf2420',

    // Cursor
    'editorCursor.foreground': '#60a5fa',

    // Line numbers
    'editorLineNumber.foreground': '#475569',
    'editorLineNumber.activeForeground': '#94a3b8',

    // Indent guides
    'editorIndentGuide.background': '#1e293b',
    'editorIndentGuide.activeBackground': '#475569',

    // Bracket matching
    'editorBracketMatch.background': '#338cf525',
    'editorBracketMatch.border': '#338cf580',

    // Widget (autocomplete dropdown)
    'editorWidget.background': '#1e293b',
    'editorWidget.border': '#334155',
    'editorWidget.foreground': '#f1f5f9',
    'editorSuggestWidget.background': '#1e293b',
    'editorSuggestWidget.border': '#334155',
    'editorSuggestWidget.selectedBackground': '#338cf530',
    'editorSuggestWidget.highlightForeground': '#60a5fa',

    // Hover widget
    'editorHoverWidget.background': '#1e293b',
    'editorHoverWidget.border': '#334155',

    // Scrollbar
    'scrollbar.shadow': '#00000030',
    'scrollbarSlider.background': '#47556930',
    'scrollbarSlider.hoverBackground': '#47556950',
    'scrollbarSlider.activeBackground': '#64748b50',

    // Error/warning squiggles
    'editorError.foreground': '#f87171',
    'editorWarning.foreground': '#fbbf24',
    'editorInfo.foreground': '#60a5fa',

    // Minimap
    'minimap.background': '#0f172a',

    // Gutter
    'editorGutter.background': '#0f172a',
    'editorGutter.foldingControlForeground': '#475569',

    // Overview ruler
    'editorOverviewRuler.errorForeground': '#f87171',
    'editorOverviewRuler.warningForeground': '#fbbf24',
    'editorOverviewRuler.infoForeground': '#60a5fa',
  },
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register Unomi UI custom themes with a Monaco instance.
 * Safe to call multiple times — only registers once.
 *
 * After registration, use theme name `'unomi-light'` or `'unomi-dark'`
 * in the `<Editor theme={...} />` prop.
 */
export function registerUnomiThemes(monaco: Monaco): void {
  if (registered) return;
  registered = true;

  monaco.editor.defineTheme('unomi-light', UNOMI_LIGHT);
  monaco.editor.defineTheme('unomi-dark', UNOMI_DARK);
}
