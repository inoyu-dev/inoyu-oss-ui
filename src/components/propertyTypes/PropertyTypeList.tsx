import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'next-i18next/pages';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Plus, RefreshCw, Tag, AlertTriangle } from 'lucide-react';
import {
  getAllPropertyTypes,
  getPropertyTypesByTarget,
  getPropertyTypesByTags,
  deletePropertyType,
  PropertyType,
} from '@/services/client/UnomiClientService';
import { useToast } from '@/components/ui/use-toast';
import PropertyTypeEditor from '@/components/propertyTypes/PropertyTypeEditor';
import PropertyTypeFilters from '@/components/propertyTypes/PropertyTypeFilters';
import PropertyTypeCard from '@/components/propertyTypes/PropertyTypeCard';
import PropertyTypeDetailDialog from '@/components/propertyTypes/PropertyTypeDetailDialog';
import { getTargetColor } from '@/components/propertyTypes/property-type-utils';

const PropertyTypeList: React.FC = () => {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<'profiles' | 'sessions' | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedPropertyType, setSelectedPropertyType] = useState<PropertyType | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPropertyType, setEditingPropertyType] = useState<PropertyType | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [targetCounts, setTargetCounts] = useState<{ profiles: number; sessions: number }>({
    profiles: 0,
    sessions: 0,
  });

  const fetchPropertyTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let data: PropertyType[] = [];

      if (selectedTarget === 'all') {
        const allTypes = await getAllPropertyTypes();
        data = [...(allTypes.profiles || []), ...(allTypes.sessions || [])];
      } else {
        data = await getPropertyTypesByTarget(selectedTarget);
      }

      if (selectedTag) {
        const taggedTypes = await getPropertyTypesByTags([selectedTag]);
        const dataIds = new Set(data.map((pt) => pt.metadata.id));
        data = taggedTypes.filter((pt) => dataIds.has(pt.metadata.id));
      }

      setPropertyTypes(data);

      const counts = { profiles: 0, sessions: 0 };
      data.forEach((pt) => {
        if (pt.target === 'profiles') counts.profiles++;
        else if (pt.target === 'sessions') counts.sessions++;
      });
      setTargetCounts(counts);

      const tags = new Set<string>();
      data.forEach((pt) => {
        pt.metadata.tags?.forEach((tag) => tags.add(tag));
      });
      setAvailableTags(Array.from(tags).sort());
    } catch (err) {
      console.error('Error fetching property types:', err);
      setError(err instanceof Error ? err.message : t('Failed to fetch property types'));
    } finally {
      setLoading(false);
    }
  }, [selectedTarget, selectedTag, t]);

  useEffect(() => {
    fetchPropertyTypes();
  }, [fetchPropertyTypes]);

  const handleCreatePropertyType = () => {
    setEditingPropertyType(null);
    setShowEditor(true);
  };

  const handleEditPropertyType = (propertyType: PropertyType) => {
    setEditingPropertyType(propertyType);
    setShowEditor(true);
  };

  const handleViewPropertyType = (propertyType: PropertyType) => {
    setSelectedPropertyType(propertyType);
    setShowDetails(true);
  };

  const handleDeletePropertyType = async (propertyTypeId: string) => {
    if (
      !confirm(
        `Are you sure you want to delete property type "${propertyTypeId}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await deletePropertyType(propertyTypeId);
      toast({
        title: t('Success'),
        description: t('Property type deleted successfully'),
      });
      await fetchPropertyTypes();
    } catch (err) {
      console.error('Error deleting property type:', err);
      toast({
        title: t('Error'),
        description: err instanceof Error ? err.message : t('Failed to delete property type'),
        variant: 'destructive',
      });
    }
  };

  const handlePropertyTypeSaved = () => {
    fetchPropertyTypes();
    setShowEditor(false);
    setEditingPropertyType(null);
  };

  const handleCopyPropertyType = (propertyType: PropertyType) => {
    navigator.clipboard.writeText(JSON.stringify(propertyType, null, 2));
    toast({
      title: t('Copied'),
      description: t('Property type JSON copied to clipboard'),
    });
  };

  const handleDownloadPropertyType = (propertyType: PropertyType) => {
    const blob = new Blob([JSON.stringify(propertyType, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${propertyType.metadata.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: t('Downloaded'),
      description: t('Property type downloaded successfully'),
    });
  };

  const filteredPropertyTypes = propertyTypes.filter((pt) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      pt.metadata.id.toLowerCase().includes(search) ||
      pt.metadata.name.toLowerCase().includes(search) ||
      pt.metadata.description?.toLowerCase().includes(search) ||
      pt.metadata.tags?.some((tag) => tag.toLowerCase().includes(search)) ||
      pt.type?.toLowerCase().includes(search)
    );
  });

  const sortedPropertyTypes = [...filteredPropertyTypes].sort((a, b) => {
    const rankA =
      typeof a.rank === 'number' ? a.rank : typeof a.rank === 'string' ? parseFloat(a.rank) : 999;
    const rankB =
      typeof b.rank === 'number' ? b.rank : typeof b.rank === 'string' ? parseFloat(b.rank) : 999;
    return rankA - rankB;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t('Loading property types...')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{t('Error')}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button onClick={fetchPropertyTypes} className="mt-2" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('Retry')}
        </Button>
      </Alert>
    );
  }

  const renderListContent = () => {
    if (sortedPropertyTypes.length === 0) {
      return (
        <Card data-testid="property-types-empty-state">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('No property types found')}</p>
              {searchTerm && <p className="text-sm">{t('Try adjusting your search criteria')}</p>}
            </div>
          </CardContent>
        </Card>
      );
    }

    if (selectedTarget === 'all') {
      const grouped = sortedPropertyTypes.reduce(
        (acc, pt) => {
          const target = pt.target || 'other';
          if (!acc[target]) acc[target] = [];
          acc[target].push(pt);
          return acc;
        },
        {} as Record<string, PropertyType[]>
      );
      const targetOrder = ['profiles', 'sessions', 'other'];

      return (
        <div className="space-y-6">
          {targetOrder.map((target) => {
            const items = grouped[target] || [];
            if (items.length === 0) return null;

            return (
              <div key={target} className="space-y-3">
                <div className="flex items-center space-x-3 pb-2 border-b">
                  <Badge
                    className={`text-sm font-semibold px-3 py-1 ${getTargetColor(target)}`}
                  >
                    {target === 'profiles'
                      ? `👤 ${t('Profile Property Types')}`
                      : target === 'sessions'
                        ? `📊 ${t('Session Property Types')}`
                        : t('Other Property Types')}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ({items.length} {items.length === 1 ? 'property type' : 'property types'})
                  </span>
                </div>
                <div className="space-y-3 pl-4">
                  {items.map((pt) => (
                    <PropertyTypeCard
                      key={pt.metadata.id}
                      propertyType={pt}
                      onEdit={handleEditPropertyType}
                      onView={handleViewPropertyType}
                      onDelete={handleDeletePropertyType}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {sortedPropertyTypes.map((pt) => (
          <PropertyTypeCard
            key={pt.metadata.id}
            propertyType={pt}
            onEdit={handleEditPropertyType}
            onView={handleViewPropertyType}
            onDelete={handleDeletePropertyType}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6" data-testid="property-types-list">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('Property Types')}</h1>
          <p className="text-muted-foreground">
            {t('Manage property type definitions')}
          </p>
          {selectedTarget === 'all' && (
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                <Badge className="bg-info-light text-info-dark border-info">
                  👤 Profiles: {targetCounts.profiles}
                </Badge>
                <Badge className="bg-success-light text-success-dark border-success">
                  📊 Sessions: {targetCounts.sessions}
                </Badge>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleCreatePropertyType}
            className="bg-secondary hover:bg-secondary-dark"
            data-testid="create-property-type"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('Create Property Type')}
          </Button>
          <Button onClick={fetchPropertyTypes} variant="outline" data-testid="refresh-property-types">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('Refresh')}
          </Button>
        </div>
      </div>

      <PropertyTypeFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedTarget={selectedTarget}
        onTargetChange={setSelectedTarget}
        selectedTag={selectedTag}
        onTagChange={setSelectedTag}
        availableTags={availableTags}
      />

      <div className="space-y-4">{renderListContent()}</div>

      <PropertyTypeDetailDialog
        propertyType={selectedPropertyType}
        open={showDetails}
        onOpenChange={setShowDetails}
        onCopy={handleCopyPropertyType}
        onDownload={handleDownloadPropertyType}
      />

      <PropertyTypeEditor
        propertyType={editingPropertyType ?? undefined}
        isOpen={showEditor}
        onClose={() => {
          setShowEditor(false);
          setEditingPropertyType(null);
        }}
        onSave={handlePropertyTypeSaved}
      />
    </div>
  );
};

export default PropertyTypeList;
