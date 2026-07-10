/**
 * useSaveEntity — Shared hook for the create/update entity flow.
 *
 * DRY: This pattern was copy-pasted across GoalBuilder, CampaignBuilder,
 * ScoringBuilder, and other Unomi entity builders.
 *
 * Handles: validation → saving state → create-or-update → toast → error handling.
 */

import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';

export interface UseSaveEntityOptions<T> {
  /** Display name shown in toasts (e.g. "Goal", "Campaign") */
  entityName: string;
  /** Called to build the payload before save */
  buildPayload: () => T;
  /** Called to validate before save — return an error string to abort, or null to proceed */
  validate?: () => string | null;
  /** Create API call */
  create: (payload: T) => Promise<unknown>;
  /** Update API call */
  update: (id: string, payload: T) => Promise<unknown>;
  /** Whether this is an edit (true) or create (false) */
  isEditing: boolean;
  /** The entity ID for updates */
  entityId?: string;
  /** Called after a successful save */
  onSuccess: () => void;
}

export function useSaveEntity<T>(options: UseSaveEntityOptions<T>) {
  const [saving, setSaving] = useState(false);

  const save = useCallback(async () => {
    // Validate
    if (options.validate) {
      const error = options.validate();
      if (error) {
        toast({ title: 'Error', description: error, variant: 'destructive' });
        return;
      }
    }

    setSaving(true);
    try {
      const payload = options.buildPayload();
      if (options.isEditing && options.entityId) {
        await options.update(options.entityId, payload);
        toast({ title: 'Success', description: `${options.entityName} updated successfully` });
      } else {
        await options.create(payload);
        toast({ title: 'Success', description: `${options.entityName} created successfully` });
      }
      options.onSuccess();
    } catch (error) {
      console.error(`Error saving ${options.entityName}:`, error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to save ${options.entityName}`,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [options]);

  return { save, saving };
}
