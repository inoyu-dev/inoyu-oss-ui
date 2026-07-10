import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Save, X } from 'lucide-react';
import { UnomiUserList } from '@/services/client/UnomiClientService';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

interface UserListBuilderProps {
  userList?: UnomiUserList | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function UserListBuilder({ userList, isOpen, onClose, onSave }: UserListBuilderProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [scope, setScope] = useState('systemscope');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userList) {
      setName(userList.metadata.name || '');
      setDescription(userList.metadata.description || '');
      setEnabled(userList.metadata.enabled ?? true);
      setScope(userList.scope || 'systemscope');
    } else {
      setName('');
      setDescription('');
      setEnabled(true);
      setScope('systemscope');
    }
  }, [userList, isOpen]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'User list name is required',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const listData: Record<string, unknown> = {
        itemId: userList?.itemId || name.toLowerCase().replace(/\s+/g, '-'),
        itemType: 'userList',
        scope: scope,
        metadata: {
          id: userList?.metadata.id || name.toLowerCase().replace(/\s+/g, '-'),
          name: name,
          description: description || undefined,
          scope: scope,
          enabled: enabled,
        },
      };

      if (userList) {
        await axios.put(`/api/cxs/lists/${userList.itemId}`, listData);
        toast({
          title: 'Success',
          description: 'User list updated successfully',
        });
      } else {
        await axios.post('/api/cxs/lists', listData);
        toast({
          title: 'Success',
          description: 'User list created successfully',
        });
      }

      onSave();
    } catch (error) {
      console.error('Error saving user list:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save user list',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{userList ? t('Edit User List') : t('Create User List')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('List Name')} *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('Enter list name')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('Description')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('Enter list description')}
              rows={3}
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

          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
            <Label htmlFor="enabled">{t('Enabled')}</Label>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            <X className="h-4 w-4 mr-2" />
            {t('Cancel')}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? t('Saving...') : t('Save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
