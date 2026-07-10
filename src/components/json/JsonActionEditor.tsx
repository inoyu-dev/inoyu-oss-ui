/**
 * JsonActionEditor — Specialized JSON editor for Unomi actions.
 *
 * Pre-configured with the Unomi Action JSON schema for validation
 * and autocompletion. Wraps JsonEntityEditor.
 *
 * Generic so the caller can use its own action type:
 *   <JsonActionEditor<Action> value={action} onChange={setAction} />
 */

import React from 'react';
import { JsonEntityEditor, type JsonEntityEditorProps } from './JsonEntityEditor';
import { UNOMI_ACTION_SCHEMA } from '@/schemas';

type Props<T> = Omit<JsonEntityEditorProps<T>, 'schema' | 'schemaUri'>;

export default function JsonActionEditor<T = Record<string, unknown>>(props: Props<T>) {
  return (
    <JsonEntityEditor<T>
      {...props}
      schema={UNOMI_ACTION_SCHEMA}
      schemaUri="http://unomi-ui/schemas/unomi-action.json"
    />
  );
}
