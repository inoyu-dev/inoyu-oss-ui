import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  UserCircle,
  Eye,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Layers,
  Target,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { getAllPersonas, type UnomiPersonaListItem } from '@/services/client/UnomiClientService';
import { useEntityList } from '@/hooks/useEntityList';
import SearchAndFilterBar from '@/components/shared/SearchAndFilterBar';

const PersonaList: React.FC = () => {
  const { t } = useTranslation();

  const {
    filteredItems: filteredPersonas,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    filterEnabled,
    cycleFilter,
    expandedItems: expandedPersonas,
    toggleExpansion: togglePersonaExpansion,
    refresh,
  } = useEntityList<UnomiPersonaListItem>({
    fetchFn: getAllPersonas,
    searchFields: ['id'],
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t('Loading personas...')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('Personas')}</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>{t('Error')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('Personas')}</CardTitle>
            <SearchAndFilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filterEnabled={filterEnabled}
              onCycleFilter={cycleFilter}
              onRefresh={refresh}
              searchPlaceholder={t('Search personas...')}
              showFilter={false}
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredPersonas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? t('No personas match your search') : t('No personas found')}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPersonas.map((persona) => (
                <Card key={persona.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePersonaExpansion(persona.id)}
                        >
                          {expandedPersonas.has(persona.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                        <UserCircle className="h-5 w-5 text-teal-600" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{persona.itemId}</h3>
                            {persona.anonymousProfile && (
                              <Badge variant="secondary">{t('Anonymous')}</Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                            {persona.segments && persona.segments.length > 0 && (
                              <span className="flex items-center">
                                <Layers className="h-3 w-3 mr-1" />
                                {persona.segments.length} {t('segments')}
                              </span>
                            )}
                            {persona.scores && Object.keys(persona.scores).length > 0 && (
                              <span className="flex items-center">
                                <Target className="h-3 w-3 mr-1" />
                                {Object.keys(persona.scores).length} {t('scores')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link href={`/profiles/${persona.itemId}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            {t('View')}
                          </Button>
                        </Link>
                      </div>
                    </div>
                    {expandedPersonas.has(persona.id) && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {persona.segments && persona.segments.length > 0 && (
                            <div>
                              <span className="font-medium">{t('Segments')}:</span>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {persona.segments.map((segment) => (
                                  <Badge key={segment} variant="outline">
                                    {segment}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {persona.scores && Object.keys(persona.scores).length > 0 && (
                            <div>
                              <span className="font-medium">{t('Scores')}:</span>
                              <div className="mt-1 space-y-1">
                                {Object.entries(persona.scores).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span>{key}:</span>
                                    <span className="font-medium">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        {persona.properties && Object.keys(persona.properties).length > 0 && (
                          <div className="mt-2">
                            <span className="font-medium">{t('Properties')}:</span>
                            <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                              {JSON.stringify(persona.properties, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonaList;
