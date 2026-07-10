import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tag, Edit, Trash2, Eye } from 'lucide-react';
import type { PropertyType } from '@/services/client/UnomiClientService';
import { getValueTypeColor, getTargetColor } from './property-type-utils';

interface PropertyTypeCardProps {
  propertyType: PropertyType;
  onEdit: (propertyType: PropertyType) => void;
  onView: (propertyType: PropertyType) => void;
  onDelete: (propertyTypeId: string) => void;
}

const PropertyTypeCard: React.FC<PropertyTypeCardProps> = ({
  propertyType,
  onEdit,
  onView,
  onDelete,
}) => {
  return (
    <Card
      className="hover:shadow-md transition-shadow"
      data-testid={`property-type-item-${propertyType.metadata.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <Tag className="h-5 w-5 text-secondary" />
            <div className="flex-1">
              <CardTitle className="text-lg">{propertyType.metadata.name}</CardTitle>
              <div className="flex items-center space-x-2 mt-1 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  ID: {propertyType.metadata.id}
                </Badge>
                {propertyType.target && (
                  <Badge
                    className={`text-xs font-semibold ${getTargetColor(propertyType.target)}`}
                  >
                    {propertyType.target === 'profiles' ? '👤 Profiles' : '📊 Sessions'}
                  </Badge>
                )}
                {propertyType.type && (
                  <Badge className={`text-xs ${getValueTypeColor(propertyType.type)}`}>
                    {propertyType.type}
                  </Badge>
                )}
                {propertyType.multivalued && (
                  <Badge variant="secondary" className="text-xs">
                    Multi-valued
                  </Badge>
                )}
                {(propertyType.protected || propertyType.protekted) && (
                  <Badge variant="secondary" className="text-xs">
                    Protected
                  </Badge>
                )}
                {propertyType.metadata.tags && propertyType.metadata.tags.length > 0 && (
                  <div className="flex items-center space-x-1">
                    {propertyType.metadata.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {propertyType.metadata.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{propertyType.metadata.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              {propertyType.metadata.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {propertyType.metadata.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(propertyType)}
              data-testid={`edit-property-type-${propertyType.metadata.id}`}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => onView(propertyType)}>
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(propertyType.metadata.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};

export default PropertyTypeCard;
