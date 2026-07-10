import React from 'react';
import { UnomiEvent } from '@/services/client/UnomiClientService';
import { PurchaseRenderer } from './web/PurchaseRenderer';
import { EmailInteractionRenderer } from './email/EmailInteractionRenderer';
import { DefaultEventRenderer } from './DefaultEventRenderer';
import { PageViewRenderer } from './web/PageViewRenderer';
import { FormSubmitRenderer } from './web/FormSubmitRenderer';  
import { SocialInteractionRenderer } from './social/SocialInteractionRenderer';
import { StoreInteractionRenderer } from './store/StoreInteractionRenderer';
import { ClickEventRenderer } from './web/ClickEventRenderer';
import { SchemaBasedEventRenderer } from './SchemaBasedEventRenderer';
import { PropertyDisplayMapping } from '@/utils/propertyDisplayMappings';

const EVENT_RENDERERS: Record<string, React.ComponentType<{ event: UnomiEvent, compact: boolean }>> = {
  'click': ClickEventRenderer,
  'page_view': PageViewRenderer,
  'form_submit': FormSubmitRenderer,
  'purchase': PurchaseRenderer,
  'social_interaction': SocialInteractionRenderer,
  'store_interaction': StoreInteractionRenderer,
  'email_interaction': EmailInteractionRenderer
};

interface EventRendererProps {
  event: UnomiEvent;
  compact?: boolean;
  useSchema?: boolean;
  customMappings?: PropertyDisplayMapping[];
}

/**
 * EventRenderer component that displays events.
 * 
 * Priority order:
 * 1. Custom renderer for specific event types (if available)
 * 2. Schema-based renderer (if useSchema is true and schema is found)
 * 3. Default renderer
 */
export function EventRenderer({ 
  event, 
  compact = false,
  useSchema = true,
  customMappings = []
}: EventRendererProps) {
  // First, check for custom renderer
  const CustomRenderer = EVENT_RENDERERS[event.eventType];
  if (CustomRenderer) {
    return <CustomRenderer event={event} compact={compact} />;
  }

  // Then, try schema-based renderer if enabled
  if (useSchema) {
    return (
      <SchemaBasedEventRenderer
        event={event}
        compact={compact}
        customMappings={customMappings}
        fallbackRenderer={DefaultEventRenderer}
      />
    );
  }

  // Fall back to default renderer
  return <DefaultEventRenderer event={event} compact={compact} />;
} 