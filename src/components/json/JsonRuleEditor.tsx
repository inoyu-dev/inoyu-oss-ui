/**
 * JsonRuleEditor — Specialized JSON editor for Unomi rules.
 *
 * Pre-configured with the Unomi Rule JSON schema for validation
 * and autocompletion. Wraps JsonEntityEditor.
 *
 * Generic so the caller can use its own rule type:
 *   <JsonRuleEditor<Rule> value={rule} onChange={setRule} />
 */

import React from 'react';
import { JsonEntityEditor, type JsonEntityEditorProps } from './JsonEntityEditor';
import { UNOMI_RULE_SCHEMA } from '@/schemas';

type Props<T> = Omit<JsonEntityEditorProps<T>, 'schema' | 'schemaUri'>;

export default function JsonRuleEditor<T = Record<string, unknown>>(props: Props<T>) {
  return (
    <JsonEntityEditor<T>
      {...props}
      schema={UNOMI_RULE_SCHEMA}
      schemaUri="http://unomi-ui/schemas/unomi-rule.json"
    />
  );
}
