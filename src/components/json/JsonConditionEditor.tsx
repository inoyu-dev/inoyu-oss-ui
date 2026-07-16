/**
 * JsonConditionEditor — Specialized JSON editor for Unomi conditions.
 *
 * Pre-configured with the Unomi Condition JSON schema for validation
 * and autocompletion. Wraps JsonEntityEditor.
 *
 * Generic so the caller can use its own condition type:
 *   <JsonConditionEditor<Condition> value={cond} onChange={setCond} />
 */

import React from 'react';
import { JsonEntityEditor, type JsonEntityEditorProps } from './JsonEntityEditor';
import { UNOMI_CONDITION_SCHEMA } from '@/schemas';

type Props<T> = Omit<JsonEntityEditorProps<T>, 'schema' | 'schemaUri'>;

export default function JsonConditionEditor<T = Record<string, unknown>>(props: Props<T>) {
  return (
    <JsonEntityEditor<T>
      {...props}
      schema={UNOMI_CONDITION_SCHEMA}
      schemaUri="http://inoyu-oss-ui/schemas/unomi-condition.json"
    />
  );
}
