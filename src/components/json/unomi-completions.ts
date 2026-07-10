/**
 * Unomi Autocompletion Providers for Monaco Editor.
 *
 * Provides context-aware autocompletion for:
 * - Condition types (profilePropertyCondition, booleanCondition, etc.)
 * - Action types (setPropertyAction, sendEventAction, etc.)
 * - Operators (equals, notEquals, greaterThan, etc.)
 * - Property name paths (properties.*, systemProperties.*)
 * - Snippets for common Unomi patterns
 *
 * Registered once per Monaco instance via `registerUnomiCompletions()`.
 */

import type { languages, editor, Position, IRange } from 'monaco-editor';

// ─── Known Unomi Condition Types ────────────────────────────────────────────

const CONDITION_TYPES: { label: string; detail: string; snippet: string }[] = [
  {
    label: 'booleanCondition',
    detail: 'Combines sub-conditions with AND/OR logic',
    snippet: [
      '{',
      '  "type": "booleanCondition",',
      '  "parameterValues": {',
      '    "operator": "${1|and,or|}",',
      '    "subConditions": [${2}]',
      '  }',
      '}',
    ].join('\n'),
  },
  {
    label: 'profilePropertyCondition',
    detail: 'Matches a profile property value',
    snippet: [
      '{',
      '  "type": "profilePropertyCondition",',
      '  "parameterValues": {',
      '    "propertyName": "${1:properties.firstName}",',
      '    "comparisonOperator": "${2|equals,notEquals,greaterThan,greaterThanOrEqualTo,lessThan,lessThanOrEqualTo,contains,startsWith,endsWith,exists,missing,in,notIn,matchesRegex,all|}",',
      '    "propertyValue": "${3}"',
      '  }',
      '}',
    ].join('\n'),
  },
  {
    label: 'sessionPropertyCondition',
    detail: 'Matches a session property value',
    snippet: [
      '{',
      '  "type": "sessionPropertyCondition",',
      '  "parameterValues": {',
      '    "propertyName": "${1:properties.}",',
      '    "comparisonOperator": "${2|equals,notEquals,greaterThan,lessThan,contains,exists,missing|}",',
      '    "propertyValue": "${3}"',
      '  }',
      '}',
    ].join('\n'),
  },
  {
    label: 'eventPropertyCondition',
    detail: 'Matches an event property value',
    snippet: [
      '{',
      '  "type": "eventPropertyCondition",',
      '  "parameterValues": {',
      '    "propertyName": "${1:properties.}",',
      '    "comparisonOperator": "${2|equals,notEquals,contains,exists,missing|}",',
      '    "propertyValue": "${3}"',
      '  }',
      '}',
    ].join('\n'),
  },
  {
    label: 'eventTypeCondition',
    detail: 'Matches events by their type',
    snippet: [
      '{',
      '  "type": "eventTypeCondition",',
      '  "parameterValues": {',
      '    "eventTypeId": "${1:view}"',
      '  }',
      '}',
    ].join('\n'),
  },
  {
    label: 'pastEventCondition',
    detail: 'Checks if a profile has past events matching criteria',
    snippet: [
      '{',
      '  "type": "pastEventCondition",',
      '  "parameterValues": {',
      '    "minimumEventCount": ${1:1},',
      '    "maximumEventCount": ${2:999},',
      '    "eventCondition": {',
      '      "type": "eventTypeCondition",',
      '      "parameterValues": {',
      '        "eventTypeId": "${3:view}"',
      '      }',
      '    }',
      '  }',
      '}',
    ].join('\n'),
  },
  {
    label: 'sourceEventPropertyCondition',
    detail: 'Matches source property on events',
    snippet: [
      '{',
      '  "type": "sourceEventPropertyCondition",',
      '  "parameterValues": {',
      '    "propertyName": "${1:itemType}",',
      '    "comparisonOperator": "${2|equals,notEquals|}",',
      '    "propertyValue": "${3}"',
      '  }',
      '}',
    ].join('\n'),
  },
  {
    label: 'profileSegmentCondition',
    detail: 'Checks if profile belongs to a segment',
    snippet: [
      '{',
      '  "type": "profileSegmentCondition",',
      '  "parameterValues": {',
      '    "segments": ["${1:segmentId}"],',
      '    "matchType": "${2|in,notIn|}"',
      '  }',
      '}',
    ].join('\n'),
  },
  {
    label: 'datePropertyCondition',
    detail: 'Matches date properties with relative or absolute comparisons',
    snippet: [
      '{',
      '  "type": "datePropertyCondition",',
      '  "parameterValues": {',
      '    "propertyName": "${1:properties.lastVisit}",',
      '    "comparisonOperator": "${2|greaterThan,lessThan,equals,between|}",',
      '    "propertyValueDateExpr": "${3:now-30d}"',
      '  }',
      '}',
    ].join('\n'),
  },
  {
    label: 'geoLocationByPointSessionCondition',
    detail: 'Matches session location within a radius',
    snippet: [
      '{',
      '  "type": "geoLocationByPointSessionCondition",',
      '  "parameterValues": {',
      '    "l.lat": ${1:48.8566},',
      '    "l.lon": ${2:2.3522},',
      '    "distance": "${3:10km}"',
      '  }',
      '}',
    ].join('\n'),
  },
  {
    label: 'notCondition',
    detail: 'Negates a sub-condition',
    snippet: [
      '{',
      '  "type": "notCondition",',
      '  "parameterValues": {',
      '    "subCondition": ${1}',
      '  }',
      '}',
    ].join('\n'),
  },
  {
    label: 'profileUserListCondition',
    detail: 'Checks if profile belongs to a user list',
    snippet: [
      '{',
      '  "type": "profileUserListCondition",',
      '  "parameterValues": {',
      '    "lists": ["${1:listId}"],',
      '    "matchType": "${2|in,notIn|}"',
      '  }',
      '}',
    ].join('\n'),
  },
];

// ─── Known Unomi Action Types ───────────────────────────────────────────────

const ACTION_TYPES: { label: string; detail: string; snippet: string }[] = [
  {
    label: 'setPropertyAction',
    detail: 'Set a profile/session property value',
    snippet: [
      '{',
      '  "type": "setPropertyAction",',
      '  "parameterValues": {',
      '    "setPropertyName": "${1:properties.}",',
      '    "setPropertyValue": "${2}",',
      '    "setPropertyStrategy": "${3|alwaysSet,setIfMissing,addValues|}"',
      '  }',
      '}',
    ].join('\n'),
  },
  {
    label: 'sendEventAction',
    detail: 'Send a new event for the current profile',
    snippet: [
      '{',
      '  "type": "sendEventAction",',
      '  "parameterValues": {',
      '    "eventType": "${1:updateProperties}",',
      '    "eventProperties": {${2}}',
      '  }',
      '}',
    ].join('\n'),
  },
  {
    label: 'mergeProfilesOnPropertyAction',
    detail: 'Merge profiles that share a property value',
    snippet: [
      '{',
      '  "type": "mergeProfilesOnPropertyAction",',
      '  "parameterValues": {',
      '    "mergeProfilePropertyValue": "${1:properties.email}",',
      '    "mergeProfilePropertyName": "${2:mergeIdentifier}"',
      '  }',
      '}',
    ].join('\n'),
  },
  {
    label: 'incrementPropertyAction',
    detail: 'Increment a numeric property',
    snippet: [
      '{',
      '  "type": "incrementPropertyAction",',
      '  "parameterValues": {',
      '    "setPropertyName": "${1:properties.visitCount}",',
      '    "setPropertyValue": ${2:1}',
      '  }',
      '}',
    ].join('\n'),
  },
  {
    label: 'copyPropertiesAction',
    detail: 'Copy properties from event to profile/session',
    snippet: [
      '{',
      '  "type": "copyPropertiesAction",',
      '  "parameterValues": {',
      '    "sourcePropertyName": "${1:properties.}",',
      '    "targetPropertyName": "${2:properties.}"',
      '  }',
      '}',
    ].join('\n'),
  },
  {
    label: 'evaluateProfileSegmentsAction',
    detail: 'Re-evaluate all segments for the current profile',
    snippet: [
      '{',
      '  "type": "evaluateProfileSegmentsAction",',
      '  "parameterValues": {}',
      '}',
    ].join('\n'),
  },
  {
    label: 'allEventToProfilePropertiesAction',
    detail: 'Copy all event properties to profile',
    snippet: [
      '{',
      '  "type": "allEventToProfilePropertiesAction",',
      '  "parameterValues": {}',
      '}',
    ].join('\n'),
  },
  {
    label: 'setEventOccurenceCountAction',
    detail: 'Count past event occurrences on profile',
    snippet: [
      '{',
      '  "type": "setEventOccurenceCountAction",',
      '  "parameterValues": {',
      '    "pastEventCondition": {',
      '      "type": "eventTypeCondition",',
      '      "parameterValues": {',
      '        "eventTypeId": "${1:view}"',
      '      }',
      '    }',
      '  }',
      '}',
    ].join('\n'),
  },
];

// ─── Common Operators ───────────────────────────────────────────────────────

const OPERATORS = [
  { label: 'equals', detail: 'Exact match' },
  { label: 'notEquals', detail: 'Does not match' },
  { label: 'greaterThan', detail: 'Numeric greater than' },
  { label: 'greaterThanOrEqualTo', detail: 'Numeric greater than or equal' },
  { label: 'lessThan', detail: 'Numeric less than' },
  { label: 'lessThanOrEqualTo', detail: 'Numeric less than or equal' },
  { label: 'contains', detail: 'String contains substring' },
  { label: 'startsWith', detail: 'String starts with' },
  { label: 'endsWith', detail: 'String ends with' },
  { label: 'matchesRegex', detail: 'Matches regular expression' },
  { label: 'exists', detail: 'Property exists and is non-null' },
  { label: 'missing', detail: 'Property is missing or null' },
  { label: 'in', detail: 'Value is in the given list' },
  { label: 'notIn', detail: 'Value is not in the given list' },
  { label: 'between', detail: 'Value is between two bounds' },
  { label: 'all', detail: 'Array contains all specified values' },
  { label: 'isDay', detail: 'Date is this day' },
  { label: 'isNotDay', detail: 'Date is not this day' },
];

// ─── Common Profile Property Paths ──────────────────────────────────────────

const PROFILE_PROPERTIES = [
  { label: 'properties.firstName', detail: 'First name' },
  { label: 'properties.lastName', detail: 'Last name' },
  { label: 'properties.email', detail: 'Email address' },
  { label: 'properties.phoneNumber', detail: 'Phone number' },
  { label: 'properties.gender', detail: 'Gender' },
  { label: 'properties.birthDate', detail: 'Birth date' },
  { label: 'properties.company', detail: 'Company name' },
  { label: 'properties.jobTitle', detail: 'Job title' },
  { label: 'properties.city', detail: 'City' },
  { label: 'properties.countryName', detail: 'Country name' },
  { label: 'properties.countryCode', detail: 'Country code (ISO)' },
  { label: 'properties.address', detail: 'Street address' },
  { label: 'properties.zipCode', detail: 'Zip/postal code' },
  { label: 'properties.age', detail: 'Age' },
  { label: 'properties.income', detail: 'Income' },
  { label: 'properties.leadScore', detail: 'Lead score' },
  { label: 'properties.lastVisit', detail: 'Last visit timestamp' },
  { label: 'properties.firstVisit', detail: 'First visit timestamp' },
  { label: 'properties.previousVisit', detail: 'Previous visit timestamp' },
  { label: 'properties.nbOfVisits', detail: 'Number of visits' },
  { label: 'properties.pageViewCount', detail: 'Total page views' },
  { label: 'properties.interests', detail: 'Interest topics (object)' },
  { label: 'systemProperties.isAnonymousProfile', detail: 'Is anonymous profile' },
  { label: 'systemProperties.lastUpdated', detail: 'Last profile update' },
  { label: 'systemProperties.mergedWith', detail: 'Merged profile ID' },
];

// ─── JSON Path Context Detection ────────────────────────────────────────────

interface JsonPathContext {
  /** Full reconstructed path like "parameterValues.comparisonOperator" */
  path: string;
  /** The nearest parent key (e.g. "comparisonOperator", "type") */
  nearestKey: string | null;
  /** Whether the cursor is at a value position (after ":") */
  isValuePosition: boolean;
  /** The root condition or action "type" value (if detectable) */
  rootType: string | null;
}

/**
 * Parses the text around the cursor to detect the JSON path context.
 * Uses a simplified heuristic that works well for typical Unomi structures.
 */
function getJsonPathContext(
  model: editor.ITextModel,
  position: Position
): JsonPathContext {
  const textBeforeCursor = model.getValueInRange({
    startLineNumber: 1,
    startColumn: 1,
    endLineNumber: position.lineNumber,
    endColumn: position.column,
  });

  // Detect if cursor is at a value position (after "key":)
  const currentLine = model.getLineContent(position.lineNumber);
  const beforeCursor = currentLine.substring(0, position.column - 1);
  const isValuePosition = /:\s*"?[^"]*$/.test(beforeCursor);

  // Find the nearest key by scanning backwards from cursor
  let nearestKey: string | null = null;
  const keyMatch = beforeCursor.match(/"(\w+)"\s*:\s*"?[^"]*$/);
  if (keyMatch) {
    nearestKey = keyMatch[1];
  }

  // Build simplified path by tracking brace nesting
  const path = buildJsonPath(textBeforeCursor);

  // Try to find the root type (for context-aware completions)
  const rootType = extractRootType(textBeforeCursor);

  return { path, nearestKey, isValuePosition, rootType };
}

function buildJsonPath(textBeforeCursor: string): string {
  const parts: string[] = [];
  let depth = 0;
  const keyStack: string[] = [];

  // Simple state machine: track keys at each brace depth
  const keyRegex = /"(\w+)"\s*:/g;
  const braceRegex = /[{}[\]]/g;

  let pos = 0;
  while (pos < textBeforeCursor.length) {
    // Find next key or brace
    keyRegex.lastIndex = pos;
    braceRegex.lastIndex = pos;

    const keyMatch = keyRegex.exec(textBeforeCursor);
    const braceMatch = braceRegex.exec(textBeforeCursor);

    if (!keyMatch && !braceMatch) break;

    const keyPos = keyMatch ? keyMatch.index : Infinity;
    const bracePos = braceMatch ? braceMatch.index : Infinity;

    if (keyPos < bracePos) {
      keyStack[depth] = keyMatch![1];
      pos = keyRegex.lastIndex;
    } else {
      const brace = braceMatch![0];
      if (brace === '{' || brace === '[') {
        depth++;
      } else if (brace === '}' || brace === ']') {
        if (depth > 0) {
          delete keyStack[depth];
          depth--;
        }
      }
      pos = braceRegex.lastIndex;
    }
  }

  // Reconstruct path from surviving keys
  for (let i = 0; i <= depth; i++) {
    if (keyStack[i]) parts.push(keyStack[i]);
  }

  return parts.join('.');
}

function extractRootType(text: string): string | null {
  // Find the first "type": "xxxx" in the text
  const typeMatch = text.match(/"type"\s*:\s*"(\w+)"/);
  return typeMatch ? typeMatch[1] : null;
}

// ─── Completion Provider ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Monaco = any;

let registered = false;

/**
 * Register Unomi-specific autocompletion providers with a Monaco instance.
 * Safe to call multiple times — only registers once.
 */
export function registerUnomiCompletions(monaco: Monaco): void {
  if (registered) return;
  registered = true;

  monaco.languages.registerCompletionItemProvider('json', {
    triggerCharacters: ['"', ':', ' ', '{'],
    provideCompletionItems(
      model: editor.ITextModel,
      position: Position
    ): languages.ProviderResult<languages.CompletionList> {
      const ctx = getJsonPathContext(model, position);
      const word = model.getWordUntilPosition(position);
      const range: IRange = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const suggestions: languages.CompletionItem[] = [];

      // ── Condition type completions ──
      if (ctx.nearestKey === 'type' && ctx.isValuePosition) {
        const isInAction =
          ctx.path.includes('actions') ||
          ctx.rootType?.includes('Action');
        const types = isInAction ? ACTION_TYPES : CONDITION_TYPES;

        for (const t of types) {
          suggestions.push({
            label: t.label,
            kind: monaco.languages.CompletionItemKind.Value,
            detail: t.detail,
            documentation: { value: `**${t.label}**\n\n${t.detail}` },
            insertText: t.label,
            range,
            sortText: `0_${t.label}`, // Sort before generic suggestions
          } as unknown as languages.CompletionItem);
        }
      }

      // ── Operator completions ──
      if (
        (ctx.nearestKey === 'comparisonOperator' || ctx.nearestKey === 'operator') &&
        ctx.isValuePosition
      ) {
        if (ctx.nearestKey === 'operator') {
          // Boolean operator — only and/or
          suggestions.push(
            {
              label: 'and',
              kind: monaco.languages.CompletionItemKind.Value,
              detail: 'All sub-conditions must match',
              insertText: 'and',
              range,
            } as unknown as languages.CompletionItem,
            {
              label: 'or',
              kind: monaco.languages.CompletionItemKind.Value,
              detail: 'Any sub-condition can match',
              insertText: 'or',
              range,
            } as unknown as languages.CompletionItem
          );
        } else {
          for (const op of OPERATORS) {
            suggestions.push({
              label: op.label,
              kind: monaco.languages.CompletionItemKind.Value,
              detail: op.detail,
              insertText: op.label,
              range,
            } as unknown as languages.CompletionItem);
          }
        }
      }

      // ── Property name path completions ──
      if (
        (ctx.nearestKey === 'propertyName' ||
          ctx.nearestKey === 'setPropertyName' ||
          ctx.nearestKey === 'sourcePropertyName' ||
          ctx.nearestKey === 'targetPropertyName') &&
        ctx.isValuePosition
      ) {
        for (const prop of PROFILE_PROPERTIES) {
          suggestions.push({
            label: prop.label,
            kind: monaco.languages.CompletionItemKind.Property,
            detail: prop.detail,
            insertText: prop.label,
            range,
          } as unknown as languages.CompletionItem);
        }
      }

      // ── Set property strategy completions ──
      if (ctx.nearestKey === 'setPropertyStrategy' && ctx.isValuePosition) {
        for (const s of ['alwaysSet', 'setIfMissing', 'addValues']) {
          suggestions.push({
            label: s,
            kind: monaco.languages.CompletionItemKind.Value,
            detail: `Strategy: ${s}`,
            insertText: s,
            range,
          } as unknown as languages.CompletionItem);
        }
      }

      // ── Event type completions ──
      if (
        (ctx.nearestKey === 'eventTypeId' || ctx.nearestKey === 'eventType') &&
        ctx.isValuePosition
      ) {
        const eventTypes = [
          { label: 'view', detail: 'Page/item view event' },
          { label: 'login', detail: 'User login event' },
          { label: 'form', detail: 'Form submission event' },
          { label: 'click', detail: 'Click event' },
          { label: 'download', detail: 'File download event' },
          { label: 'search', detail: 'Search query event' },
          { label: 'sessionCreated', detail: 'New session created' },
          { label: 'updateProperties', detail: 'Profile property update' },
          { label: 'identify', detail: 'User identification event' },
          { label: 'goal', detail: 'Goal completion event' },
        ];
        for (const et of eventTypes) {
          suggestions.push({
            label: et.label,
            kind: monaco.languages.CompletionItemKind.Value,
            detail: et.detail,
            insertText: et.label,
            range,
          } as unknown as languages.CompletionItem);
        }
      }

      // ── Match type completions ──
      if (ctx.nearestKey === 'matchType' && ctx.isValuePosition) {
        suggestions.push(
          {
            label: 'in',
            kind: monaco.languages.CompletionItemKind.Value,
            detail: 'Profile is in the specified list/segment',
            insertText: 'in',
            range,
          } as unknown as languages.CompletionItem,
          {
            label: 'notIn',
            kind: monaco.languages.CompletionItemKind.Value,
            detail: 'Profile is not in the specified list/segment',
            insertText: 'notIn',
            range,
          } as unknown as languages.CompletionItem
        );
      }

      // ── Snippet completions (at object start positions) ──
      if (!ctx.isValuePosition && ctx.path.includes('subConditions')) {
        for (const ct of CONDITION_TYPES) {
          suggestions.push({
            label: `snippet: ${ct.label}`,
            kind: monaco.languages.CompletionItemKind.Snippet,
            detail: ct.detail,
            documentation: { value: `Insert a **${ct.label}** condition block` },
            insertText: ct.snippet,
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            sortText: `1_${ct.label}`,
          } as unknown as languages.CompletionItem);
        }
      }

      if (
        !ctx.isValuePosition &&
        (ctx.path.includes('actions') || ctx.nearestKey === 'actions')
      ) {
        for (const at of ACTION_TYPES) {
          suggestions.push({
            label: `snippet: ${at.label}`,
            kind: monaco.languages.CompletionItemKind.Snippet,
            detail: at.detail,
            documentation: { value: `Insert a **${at.label}** action block` },
            insertText: at.snippet,
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            sortText: `1_${at.label}`,
          } as unknown as languages.CompletionItem);
        }
      }

      return { suggestions };
    },
  });
}

// ─── Hover Provider ─────────────────────────────────────────────────────────

/**
 * Register hover documentation for Unomi types.
 */
export function registerUnomiHoverProvider(monaco: Monaco): void {
  monaco.languages.registerHoverProvider('json', {
    provideHover(
      model: editor.ITextModel,
      position: Position
    ): languages.ProviderResult<languages.Hover> {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const text = word.word;

      // Check condition types
      const ct = CONDITION_TYPES.find((c) => c.label === text);
      if (ct) {
        return {
          range: {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          },
          contents: [
            { value: `**Condition Type: ${ct.label}**` },
            { value: ct.detail },
          ],
        };
      }

      // Check action types
      const at = ACTION_TYPES.find((a) => a.label === text);
      if (at) {
        return {
          range: {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          },
          contents: [
            { value: `**Action Type: ${at.label}**` },
            { value: at.detail },
          ],
        };
      }

      // Check operators
      const op = OPERATORS.find((o) => o.label === text);
      if (op) {
        return {
          range: {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          },
          contents: [
            { value: `**Operator: ${op.label}**` },
            { value: op.detail },
          ],
        };
      }

      return null;
    },
  });
}
