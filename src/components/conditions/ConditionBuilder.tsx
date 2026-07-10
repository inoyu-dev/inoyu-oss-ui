/**
 * ConditionBuilder — JSON-based editor for Unomi conditions.
 *
 * Uses the Monaco-based JsonConditionEditor with schema validation.
 * Plugins can register an alternative editor via the
 * PluginRegistry ('conditions/ConditionBuilder').
 */
import React from 'react';
import { Label } from '@/components/ui/label';
import JsonConditionEditor from '@/components/json/JsonConditionEditor';
import type { Condition } from '@/services/shared/types';

export interface ConditionBuilderProps {
  /** Current condition value */
  value: Condition | undefined;
  /** Called when the condition changes */
  onChange: (condition: Condition) => void;
  /** Initial editing mode (ignored in open-source — always JSON) */
  mode?: 'visual' | 'json';
  /** Restrict to specific system tags (ignored in JSON mode) */
  systemTag?: string;
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

export default function ConditionBuilder({
  value,
  onChange,
  height = 200,
  readOnly = false,
  label,
}: ConditionBuilderProps) {
  return (
    <div className="space-y-2">
      {label && <Label className="text-sm font-semibold">{label}</Label>}
      <JsonConditionEditor
        value={value}
        onChange={readOnly ? undefined : onChange}
        height={height}
        readOnly={readOnly}
      />
    </div>
  );
}
