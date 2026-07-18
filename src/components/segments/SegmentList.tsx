import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Eye,
  Trash2,
  RefreshCw,
  Calendar,
  Tag,
  Settings,
  ChevronRight,
  ChevronDown,
  Plus,
  Edit3,
} from 'lucide-react';
import {
  getAllSegments,
  getSegmentDefinition,
  getSegmentProfiles,
  getSegmentProfileCount,
  deleteSegment,
  type UnomiMetadata,
  type UnomiSegment,
  type UnomiProfile,
} from '@/services/client/UnomiClientService';
import { useTranslation } from 'react-i18next';
import { useEntityList } from '@/hooks/useEntityList';
import SearchAndFilterBar from '@/components/shared/SearchAndFilterBar';
import SegmentBuilder, { type SegmentBuilderProps } from './SegmentBuilder';
import { useRegisteredComponent } from '@/plugins/useRegisteredComponent';

interface SegmentWithCount extends UnomiMetadata {
  profileCount?: number;
}

const SegmentList: React.FC = () => {
  const { t } = useTranslation();
  const ResolvedSegmentBuilder = useRegisteredComponent<SegmentBuilderProps>(
    'segments/SegmentBuilder',
    SegmentBuilder
  );

  const fetchSegmentsWithCounts = useCallback(async (): Promise<SegmentWithCount[]> => {
    const segmentsData = await getAllSegments(0, 100, 'name:asc');
    return Promise.all(
      segmentsData.map(async (segment) => {
        try {
          const count = await getSegmentProfileCount(segment.id);
          return { ...segment, profileCount: count };
        } catch {
          return { ...segment, profileCount: 0 };
        }
      })
    );
  }, []);

  const {
    filteredItems: filteredSegments,
    loading,
    error,
    setError,
    searchTerm,
    setSearchTerm,
    filterEnabled,
    cycleFilter,
    expandedItems: expandedSegments,
    toggleExpansion: toggleSegmentExpansion,
    refresh,
    handleDelete: handleDeleteSegment,
  } = useEntityList({
    fetchFn: fetchSegmentsWithCounts,
    deleteFn: deleteSegment,
    deleteConfirmMessage: t('Are you sure you want to delete this segment? This action cannot be undone.'),
  });

  const [selectedSegment, setSelectedSegment] = useState<UnomiSegment | null>(null);
  const [segmentProfiles, setSegmentProfiles] = useState<UnomiProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [showSegmentBuilder, setShowSegmentBuilder] = useState(false);
  const [editingSegment, setEditingSegment] = useState<UnomiSegment | null>(null);

  const fetchSegmentDetails = useCallback(
    async (segmentId: string) => {
      try {
        setProfilesLoading(true);
        const [segmentDef, profilesData] = await Promise.all([
          getSegmentDefinition(segmentId),
          getSegmentProfiles(segmentId, 0, 20, 'properties.lastVisit:desc'),
        ]);
        setSelectedSegment(segmentDef);
        setSegmentProfiles(profilesData.list || []);
      } catch (err) {
        console.error('Error fetching segment details:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch segment details');
      } finally {
        setProfilesLoading(false);
      }
    },
    [setError]
  );

  const handleCreateSegment = () => {
    setEditingSegment(null);
    setShowSegmentBuilder(true);
  };

  const handleEditSegment = useCallback(
    async (segmentId: string) => {
      try {
        const segmentDef = await getSegmentDefinition(segmentId);
        setEditingSegment(segmentDef);
        setShowSegmentBuilder(true);
      } catch (err) {
        console.error('Error fetching segment for editing:', err);
        setError(err instanceof Error ? err.message : 'Failed to load segment for editing');
      }
    },
    [setError]
  );

  const handleSegmentSaved = useCallback(() => {
    refresh();
    setShowSegmentBuilder(false);
    setEditingSegment(null);
  }, [refresh]);

  const handleBuilderClose = useCallback(() => {
    setShowSegmentBuilder(false);
    setEditingSegment(null);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t('Loading segments...')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('Segments')}</h1>
          <p className="text-muted-foreground">
            {t('Manage customer segments and view their profiles')}
          </p>
        </div>
        <Button onClick={handleCreateSegment} className="bg-info hover:bg-info-dark" data-testid="create-segment">
          <Plus className="h-4 w-4 mr-2" />
          {t('Create Segment')}
        </Button>
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
            <CardTitle>{t('Segments')}</CardTitle>
            <SearchAndFilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filterEnabled={filterEnabled}
              onCycleFilter={cycleFilter}
              onRefresh={refresh}
              searchPlaceholder={t('Search segments by name, description, or ID...')}
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredSegments.length === 0 ? (
            <Card data-testid="segments-empty-state">
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>
                    {searchTerm || filterEnabled !== null
                      ? t('No segments match your filters')
                      : t('No segments found')}
                  </p>
                  {searchTerm && <p className="text-sm">{t('Try adjusting your search criteria')}</p>}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4" data-testid="segments-list">
              {filteredSegments.map((segment) => (
                <Card
                  key={segment.id}
                  className="hover:shadow-md transition-shadow"
                  data-testid={`segment-item-${segment.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSegmentExpansion(segment.id)}
                          className="p-1"
                        >
                          {expandedSegments.has(segment.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                        <div>
                          <CardTitle className="text-lg">{segment.name}</CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant={segment.enabled ? 'default' : 'secondary'}>
                              {segment.enabled ? t('Enabled') : t('Disabled')}
                            </Badge>
                            <Badge variant="outline">
                              <Users className="h-3 w-3 mr-1" />
                              {segment.profileCount ?? 0} {t('profiles')}
                            </Badge>
                            {segment.tags && segment.tags.length > 0 && (
                              <Badge variant="outline">
                                <Tag className="h-3 w-3 mr-1" />
                                {segment.tags.length} {t('tags')}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSegment(segment.id)}
                          data-testid={`edit-segment-${segment.id}`}
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          {t('Edit')}
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => fetchSegmentDetails(segment.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              {t('View Details')}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{segment.name}</DialogTitle>
                            </DialogHeader>
                            {selectedSegment && (
                              <Tabs defaultValue="overview" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                  <TabsTrigger value="overview">{t('Overview')}</TabsTrigger>
                                  <TabsTrigger value="condition">{t('Condition')}</TabsTrigger>
                                  <TabsTrigger value="profiles">{t('Profiles')}</TabsTrigger>
                                </TabsList>
                                <TabsContent value="overview" className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h3 className="font-semibold mb-2">{t('Basic Information')}</h3>
                                      <div className="space-y-2 text-sm">
                                        <div>
                                          <strong>ID:</strong> {selectedSegment.itemId}
                                        </div>
                                        <div>
                                          <strong>{t('Scope')}:</strong> {selectedSegment.scope}
                                        </div>
                                        <div>
                                          <strong>{t('Version')}:</strong> {selectedSegment.version}
                                        </div>
                                        <div>
                                          <strong>{t('Enabled')}:</strong>{' '}
                                          {selectedSegment.metadata.enabled ? t('Yes') : t('No')}
                                        </div>
                                        {selectedSegment.metadata.description && (
                                          <div>
                                            <strong>{t('Description')}:</strong>{' '}
                                            {selectedSegment.metadata.description}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <h3 className="font-semibold mb-2">{t('Tags & Metadata')}</h3>
                                      <div className="space-y-2 text-sm">
                                        {selectedSegment.metadata.tags &&
                                          selectedSegment.metadata.tags.length > 0 && (
                                            <div>
                                              <strong>{t('Tags')}:</strong>
                                              <div className="flex flex-wrap gap-1 mt-1">
                                                {selectedSegment.metadata.tags.map((tag, index) => (
                                                  <Badge key={index} variant="secondary" className="text-xs">
                                                    {tag}
                                                  </Badge>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        {selectedSegment.metadata.systemTags &&
                                          selectedSegment.metadata.systemTags.length > 0 && (
                                            <div>
                                              <strong>{t('System Tags')}:</strong>
                                              <div className="flex flex-wrap gap-1 mt-1">
                                                {selectedSegment.metadata.systemTags.map((tag, index) => (
                                                  <Badge key={index} variant="outline" className="text-xs">
                                                    {tag}
                                                  </Badge>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                      </div>
                                    </div>
                                  </div>
                                </TabsContent>
                                <TabsContent value="condition" className="space-y-4">
                                  <div>
                                    <h3 className="font-semibold mb-2">{t('Segment Condition')}</h3>
                                    <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                                      {JSON.stringify(selectedSegment.condition, null, 2)}
                                    </pre>
                                  </div>
                                </TabsContent>
                                <TabsContent value="profiles" className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h3 className="font-semibold">{t('Matching Profiles')}</h3>
                                    {profilesLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
                                  </div>
                                  {segmentProfiles.length === 0 ? (
                                    <div className="text-center text-muted-foreground py-8">
                                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                      <p>{t('No profiles found in this segment')}</p>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      {segmentProfiles.map((profile) => (
                                        <Card key={profile.itemId} className="p-3">
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <div className="font-medium">
                                                {profile.properties.firstName} {profile.properties.lastName}
                                              </div>
                                              <div className="text-sm text-muted-foreground">
                                                {profile.properties.email}
                                              </div>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                              {profile.segments.length} {t('segments')}
                                            </div>
                                          </div>
                                        </Card>
                                      ))}
                                    </div>
                                  )}
                                </TabsContent>
                              </Tabs>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSegment(segment.id)}
                          disabled={segment.readOnly}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('Delete')}
                        </Button>
                      </div>
                    </div>
                    {segment.description && (
                      <p className="text-sm text-muted-foreground ml-8">{segment.description}</p>
                    )}
                  </CardHeader>
                  {expandedSegments.has(segment.id) && (
                    <CardContent className="pt-0">
                      <div className="ml-8 space-y-2 text-sm">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Settings className="h-4 w-4 text-muted-foreground" />
                            <span>ID: {segment.id}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{t('Scope')}: {segment.scope}</span>
                          </div>
                        </div>
                        {segment.tags && segment.tags.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-wrap gap-1">
                              {segment.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ResolvedSegmentBuilder
        segment={editingSegment ?? undefined}
        isOpen={showSegmentBuilder}
        onClose={handleBuilderClose}
        onSave={handleSegmentSaved}
      />
    </div>
  );
};

export default SegmentList;
