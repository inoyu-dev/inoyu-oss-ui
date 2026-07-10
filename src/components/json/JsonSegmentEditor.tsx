/**
 * JsonSegmentEditor — Specialized JSON editor for Unomi segments.
 *
 * Pre-configured with the Unomi Segment JSON schema for validation
 * and autocompletion. Wraps JsonEntityEditor.
 *
 * Generic so the caller can use its own segment type:
 *   <JsonSegmentEditor<Segment> value={segment} onChange={setSegment} />
 */

import React from 'react';
import { JsonEntityEditor, type JsonEntityEditorProps } from './JsonEntityEditor';
import { UNOMI_SEGMENT_SCHEMA } from '@/schemas';

type Props<T> = Omit<JsonEntityEditorProps<T>, 'schema' | 'schemaUri'>;

export default function JsonSegmentEditor<T = Record<string, unknown>>(props: Props<T>) {
  return (
    <JsonEntityEditor<T>
      {...props}
      schema={UNOMI_SEGMENT_SCHEMA}
      schemaUri="http://unomi-ui/schemas/unomi-segment.json"
    />
  );
}
