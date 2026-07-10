import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ProfilePropertiesViewerProps {
  properties: Record<string, unknown>;
}

export function ProfilePropertiesViewer({ properties }: ProfilePropertiesViewerProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [expandedGroups, setExpandedGroups] = React.useState<string[]>([]);

  // Debug logging
  React.useEffect(() => {
    console.log('ProfilePropertiesViewer received properties:', properties);
    console.log('Properties type:', typeof properties);
    console.log('Properties keys:', properties ? Object.keys(properties) : 'No properties');
  }, [properties]);

  // Group properties by dot notation
  const groupProperties = (props: Record<string, unknown>) => {
    const groups: Record<string, Record<string, unknown>> = {};
    
    const processObject = (obj: Record<string, unknown>, prefix: string = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          // Process nested object recursively
          processObject(value as Record<string, unknown>, fullKey);
        } else {
          // Handle primitive values
          const parts = fullKey.split('.');
          const groupName = parts[0];
          const propertyName = parts.slice(1).join('.');
          
          // Initialize group if it doesn't exist
          if (!groups[groupName]) {
            groups[groupName] = {};
          }
          
          // Use the property name or the original key if no nesting
          const finalPropertyName = propertyName || key;
          groups[groupName][finalPropertyName] = value;
        }
      });
    };

    processObject(props);
    return groups;
  };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupName) 
        ? prev.filter(g => g !== groupName)
        : [...prev, groupName]
    );
  };

  const formatValue = (value: unknown): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return JSON.stringify(value, null, 2);
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  // Safety check for properties
  if (!properties || typeof properties !== 'object') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Profile Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <p>No properties available for this profile.</p>
            <p className="text-sm mt-2">Properties data: {JSON.stringify(properties)}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const groupedProperties = groupProperties(properties);
  console.log('Grouped properties:', groupedProperties);
  
  const filteredGroups = Object.entries(groupedProperties).filter(([groupName, props]) => {
    const searchLower = searchTerm.toLowerCase();
    return groupName.toLowerCase().includes(searchLower) ||
      Object.entries(props).some(([key, value]) => 
        key.toLowerCase().includes(searchLower) ||
        formatValue(value).toLowerCase().includes(searchLower)
      );
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Profile Properties
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search properties..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {filteredGroups.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>No properties found matching your search.</p>
              {Object.keys(groupedProperties).length === 0 && (
                <p className="text-sm mt-2">No properties available for this profile.</p>
              )}
            </div>
          ) : (
            filteredGroups.map(([groupName, props]) => (
            <div key={groupName} className="mb-4">
              <button
                onClick={() => toggleGroup(groupName)}
                className="flex items-center gap-2 w-full text-left p-2 hover:bg-accent rounded-md"
              >
                <span className="transform transition-transform duration-200">
                  {expandedGroups.includes(groupName) ? '▼' : '▶'}
                </span>
                <h3 className="text-lg font-semibold capitalize">{groupName}</h3>
                <span className="text-muted-foreground text-sm">
                  ({Object.keys(props).length} properties)
                </span>
              </button>
              
              {expandedGroups.includes(groupName) && (
                <div className="mt-2 pl-6">
                  {Object.entries(props).map(([key, value]) => (
                    <div key={key} className="py-2 px-4 hover:bg-accent/50 rounded-md">
                      <div className="font-medium text-sm">{key}</div>
                      <pre className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                        {formatValue(value)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 