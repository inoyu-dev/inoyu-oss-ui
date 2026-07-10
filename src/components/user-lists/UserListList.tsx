import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  List,
  Eye,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Plus,
  Edit3,
} from 'lucide-react';
import {
  getAllUserLists,
  getUserListDefinition,
} from '@/services/client/UnomiClientService';
import type { UnomiUserList } from '@/services/client/UnomiClientService';
import { useTranslation } from 'react-i18next';
import { useEntityList } from '@/hooks/useEntityList';
import SearchAndFilterBar from '@/components/shared/SearchAndFilterBar';
import UserListBuilder from './UserListBuilder';

const UserListList: React.FC = () => {
  const { t } = useTranslation();

  const {
    filteredItems: filteredLists,
    loading,
    error,
    setError,
    searchTerm,
    setSearchTerm,
    filterEnabled,
    cycleFilter,
    expandedItems: expandedLists,
    toggleExpansion: toggleListExpansion,
    refresh,
  } = useEntityList({
    fetchFn: getAllUserLists,
  });

  const [selectedList, setSelectedList] = useState<UnomiUserList | null>(null);
  const [showListBuilder, setShowListBuilder] = useState(false);
  const [editingList, setEditingList] = useState<UnomiUserList | null>(null);

  const fetchListDetails = useCallback(
    async (listId: string) => {
      try {
        const listDef = await getUserListDefinition(listId);
        setSelectedList(listDef);
      } catch (err) {
        console.error('Error fetching list details:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch list details');
      }
    },
    [setError]
  );

  const handleCreateList = () => {
    setEditingList(null);
    setShowListBuilder(true);
  };

  const handleEditList = useCallback(
    async (listId: string) => {
      try {
        const listDef = await getUserListDefinition(listId);
        setEditingList(listDef);
        setShowListBuilder(true);
      } catch (err) {
        console.error('Error fetching list for editing:', err);
        setError(err instanceof Error ? err.message : 'Failed to load list for editing');
      }
    },
    [setError]
  );

  const handleListSaved = useCallback(() => {
    refresh();
    setShowListBuilder(false);
    setEditingList(null);
  }, [refresh]);

  const handleBuilderClose = useCallback(() => {
    setShowListBuilder(false);
    setEditingList(null);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading user lists...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('User Lists')}</h1>
        <Button onClick={handleCreateList}>
          <Plus className="h-4 w-4 mr-2" />
          {t('Create User List')}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('User Lists')}</CardTitle>
            <SearchAndFilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filterEnabled={filterEnabled}
              onCycleFilter={cycleFilter}
              onRefresh={refresh}
              searchPlaceholder={t('Search user lists...')}
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredLists.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || filterEnabled !== null
                ? t('No user lists match your filters')
                : t('No user lists found. Create your first user list to get started.')}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLists.map((list) => (
                <Card key={list.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleListExpansion(list.id)}
                        >
                          {expandedLists.has(list.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                        <List className="h-5 w-5 text-teal-600" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{list.name}</h3>
                            <Badge variant={list.enabled ? 'default' : 'secondary'}>
                              {list.enabled ? t('Enabled') : t('Disabled')}
                            </Badge>
                          </div>
                          {list.description && (
                            <p className="text-sm text-muted-foreground mt-1">{list.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                            <span>ID: {list.id}</span>
                            {list.scope && <span>Scope: {list.scope}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchListDetails(list.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {t('View')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditList(list.id)}
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          {t('Edit')}
                        </Button>
                      </div>
                    </div>
                    {expandedLists.has(list.id) && selectedList?.itemId === list.id && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">{t('Scope')}:</span> {selectedList.scope}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showListBuilder && (
        <UserListBuilder
          userList={editingList}
          isOpen={showListBuilder}
          onClose={handleBuilderClose}
          onSave={handleListSaved}
        />
      )}
    </div>
  );
};

export default UserListList;
