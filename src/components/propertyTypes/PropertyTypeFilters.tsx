import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Filter, Tag } from 'lucide-react';

interface PropertyTypeFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedTarget: 'profiles' | 'sessions' | 'all';
  onTargetChange: (value: 'profiles' | 'sessions' | 'all') => void;
  selectedTag: string | null;
  onTagChange: (value: string | null) => void;
  availableTags: string[];
}

const PropertyTypeFilters: React.FC<PropertyTypeFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedTarget,
  onTargetChange,
  selectedTag,
  onTagChange,
  availableTags,
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search property types by ID, name, description, tags, or type..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Target:</span>
              <select
                value={selectedTarget}
                onChange={(e) => onTargetChange(e.target.value as typeof selectedTarget)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="all">All</option>
                <option value="profiles">Profiles</option>
                <option value="sessions">Sessions</option>
              </select>
            </div>

            {availableTags.length > 0 && (
              <div className="flex items-center space-x-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Tag:</span>
                <select
                  value={selectedTag || ''}
                  onChange={(e) => onTagChange(e.target.value || null)}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="">All Tags</option>
                  {availableTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyTypeFilters;
