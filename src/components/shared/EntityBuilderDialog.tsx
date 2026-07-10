/**
 * EntityBuilderDialog — Shared dialog shell for Unomi entity builders.
 *
 * DRY: GoalBuilder, CampaignBuilder, ScoringBuilder, and other builders
 * all use the same Dialog → DialogContent → Header → children → Save/Cancel
 * layout. This component extracts that common structure.
 */

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Save, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface EntityBuilderDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Called when the dialog should close */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Dialog body content */
  children: React.ReactNode;
  /** Save handler */
  onSave: () => void | Promise<void>;
  /** Cancel handler (defaults to closing the dialog) */
  onCancel?: () => void;
  /** Whether save is in progress */
  saving?: boolean;
  /** Additional disabled condition for save button */
  saveDisabled?: boolean;
  /** Max width class (default: 'max-w-4xl') */
  maxWidth?: string;
}

export function EntityBuilderDialog({
  open,
  onOpenChange,
  title,
  children,
  onSave,
  onCancel,
  saving = false,
  saveDisabled = false,
  maxWidth = 'max-w-4xl',
}: EntityBuilderDialogProps) {
  const { t } = useTranslation();

  const handleCancel = onCancel ?? (() => onOpenChange(false));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${maxWidth} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {children}

        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            <X className="h-4 w-4 mr-2" />
            {t('Cancel')}
          </Button>
          <Button onClick={onSave} disabled={saving || saveDisabled}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? t('Saving...') : t('Save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
