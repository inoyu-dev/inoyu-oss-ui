# Property Types UI Components

This directory contains components and utilities for managing and using property types in the Inoyu OSS UI.

## Components

### PropertyTypeList
Main component for managing property types. Provides:
- List view with search and filtering
- Create, edit, delete operations
- Grouped display by target (profiles/sessions)
- Detailed view with JSON preview

### PropertyTypeEditor
Form-based editor for creating and editing property types with tabs for:
- Basic information (ID, name, type, target)
- Metadata (scope, tags, system tags)
- Ranges (numeric, date, IP)
- Advanced settings (merge strategy, automatic mappings)

### PropertyTypeSelector
Reusable component for selecting property types in condition builders and forms.

**Example usage:**
```tsx
import { PropertyTypeSelector } from '@/components/propertyTypes/PropertyTypeSelector';

function ConditionBuilder() {
  const [propertyId, setPropertyId] = useState('');
  
  return (
    <PropertyTypeSelector
      target="profiles"
      value={propertyId}
      onChange={setPropertyId}
      label="Select Property"
      showTypeInfo
    />
  );
}
```

## Hooks

### usePropertyTypes
Hook for fetching property types with filtering options.

**Example usage:**
```tsx
import { usePropertyTypes } from '@/hooks/usePropertyTypes';

function MyComponent() {
  const { propertyTypes, loading, error } = usePropertyTypes({
    target: 'profiles',
    tags: ['marketing'],
    enabled: true
  });
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {propertyTypes.map(pt => (
        <div key={pt.metadata.id}>{pt.metadata.name}</div>
      ))}
    </div>
  );
}
```

## Utility Functions

Available from `@/hooks/usePropertyTypes`:

- `getPropertyTypeById()` - Find property type by ID
- `groupPropertyTypesByTarget()` - Group by profiles/sessions
- `groupPropertyTypesByTag()` - Group by tags
- `sortPropertyTypesByRank()` - Sort by display rank
- `getInputTypeForPropertyType()` - Get HTML input type
- `getOptionsForPropertyType()` - Get select options from ranges
- `isPropertyTypeEditable()` - Check if editable
- `getPropertyTypeDisplayName()` - Get display name

## Integration with Condition Builders

Property types can be used to enhance condition builders by:

1. **Auto-completing property names** - Use `PropertyTypeSelector` instead of text input
2. **Showing available operators** - Filter operators based on property type
3. **Providing value suggestions** - Use ranges to show available values
4. **Type validation** - Validate input based on property type

**Example integration:**
```tsx
import { PropertyTypeSelector } from '@/components/propertyTypes/PropertyTypeSelector';
import { usePropertyTypes, getInputTypeForPropertyType } from '@/hooks/usePropertyTypes';

function EnhancedConditionBuilder() {
  const [propertyId, setPropertyId] = useState('');
  const { propertyTypes } = usePropertyTypes({ target: 'profiles' });
  
  const selectedProperty = propertyTypes.find(pt => pt.metadata.id === propertyId);
  const inputType = selectedProperty ? getInputTypeForPropertyType(selectedProperty) : 'text';
  
  return (
    <div>
      <PropertyTypeSelector
        target="profiles"
        value={propertyId}
        onChange={setPropertyId}
      />
      {selectedProperty && (
        <input
          type={inputType}
          placeholder={`Enter ${selectedProperty.metadata.name}`}
        />
      )}
    </div>
  );
}
```

## API Endpoints

All property type operations use the Apache Unomi REST API through `/api/cxs/profiles/properties`:

- `GET /api/cxs/profiles/properties` - Get all (grouped by target)
- `GET /api/cxs/profiles/properties/targets/{target}` - Get by target
- `GET /api/cxs/profiles/properties/{id}` - Get specific property type
- `GET /api/cxs/profiles/properties/tags/{tags}` - Get by tags
- `GET /api/cxs/profiles/properties/systemTags/{tag}` - Get by system tag
- `POST /api/cxs/profiles/properties` - Create/update
- `DELETE /api/cxs/profiles/properties/{id}` - Delete

## Best Practices

1. **Use the hook** - Always use `usePropertyTypes` hook instead of direct API calls
2. **Filter by target** - Specify target when possible to reduce data
3. **Cache results** - Property types don't change frequently, consider caching
4. **Show type info** - Display property type information to help users
5. **Validate inputs** - Use property type metadata for client-side validation
6. **Respect protected flags** - Don't allow editing of protected properties
