import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { X, Upload } from 'lucide-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

interface GroovyAction {
  id: string;
  name: string;
  version?: string;
  scope?: string;
  deployed?: boolean;
}

interface GroovyActionEditorProps {
  action?: GroovyAction | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function GroovyActionEditor({
  action,
  isOpen,
  onClose,
  onSave,
}: GroovyActionEditorProps) {
  const { t } = useTranslation();
  const { featureFlags } = useFeatureFlags();
  const [name, setName] = useState('');
  const [scope, setScope] = useState('systemscope');
  const [script, setScript] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (action) {
      setName(action.name || '');
      setScope(action.scope || 'systemscope');
      setScript('');
    } else {
      setName('');
      setScope('systemscope');
      setScript('');
      setFile(null);
    }
  }, [action, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setScript(event.target.result as string);
        }
      };
      reader.readAsText(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Action name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!script.trim() && !file) {
      toast({
        title: 'Error',
        description: 'Groovy script is required',
        variant: 'destructive',
      });
      return;
    }

    if (!featureFlags.groovyActions) {
      toast({
        title: 'Error',
        description: 'Groovy actions are not available in this deployment type',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('actionName', name);
      formData.append('scope', scope);
      if (file) {
        formData.append('file', file);
      } else if (script) {
        // Create a blob from the script text
        const scriptBlob = new Blob([script], { type: 'text/x-groovy' });
        formData.append('script', scriptBlob, `${name}.groovy`);
      }

      // The catch-all proxy at /api/cxs/[...path].ts will handle forwarding to Unomi
      // Note: The catch-all proxy may need updates to properly handle multipart/form-data
      await axios.post('/api/cxs/groovy-actions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      toast({
        title: 'Success',
        description: 'Groovy action deployed successfully',
      });

      onSave();
    } catch (error) {
      console.error('Error deploying groovy action:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to deploy groovy action',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {action ? t('Edit Groovy Action') : t('Deploy Groovy Action')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('Action Name')} *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('Enter action name')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scope">{t('Scope')}</Label>
            <Input
              id="scope"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              placeholder="systemscope"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">{t('Upload Groovy File')}</Label>
            <Input
              id="file"
              type="file"
              accept=".groovy"
              onChange={handleFileChange}
            />
            <p className="text-xs text-muted-foreground">
              {t('Or paste the script below')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="script">{t('Groovy Script')} *</Label>
            <Textarea
              id="script"
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder={t('Paste your Groovy script here...')}
              rows={15}
              className="font-mono text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            <X className="h-4 w-4 mr-2" />
            {t('Cancel')}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Upload className="h-4 w-4 mr-2" />
            {saving ? t('Deploying...') : t('Deploy')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
