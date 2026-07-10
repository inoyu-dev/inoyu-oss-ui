/**
 * ActionBuilder — JSON-based editor for Unomi actions.
 *
 * Uses the Monaco-based JsonActionEditor with schema validation.
 * Plugins can register an alternative editor via the
 * PluginRegistry ('conditions/ActionBuilder').
 */
import React from 'react';
import { Label } from '@/components/ui/label';
import JsonActionEditor from '@/components/json/JsonActionEditor';
import type { Action } from '@/services/shared/types';

export interface ActionBuilderProps {
  /** Current action value */
  value: Action | undefined;
  /** Called when the action changes */
  onChange: (action: Action) => void;
  /** Initial editing mode (ignored in open-source — always JSON) */
  mode?: 'visual' | 'json';
  /** Editor height for JSON mode */
  height?: number;
  /** Whether the editor is read-only */
  readOnly?: boolean;
  /** Show the mode toggle tabs (ignored — single mode) */
  showModeTabs?: boolean;
  /** Label to show above the editor */
  label?: string;
  /** Compact mode */
  compact?: boolean;
}

export default function ActionBuilder({
  value,
  onChange,
  height = 200,
  readOnly = false,
  label,
}: ActionBuilderProps) {
  return (
    <div className="space-y-2">
      {label && <Label className="text-sm font-semibold">{label}</Label>}
      <JsonActionEditor
        value={value}
        onChange={readOnly ? undefined : onChange}
        height={height}
        readOnly={readOnly}
      />
    </div>
  );
}
