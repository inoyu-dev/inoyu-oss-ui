/**
 * Shared types and constants for the Rule builder components.
 */

import type { LucideIcon } from 'lucide-react';
import {
  Users,
  Copy,
  Zap,
  Target,
  Mail,
  Globe,
} from 'lucide-react';

export interface RuleCondition {
  id: string;
  type: 'profilePropertyCondition' | 'sessionPropertyCondition' | 'eventCondition' | 'booleanCondition';
  field: string;
  operator: string;
  value: string | number | string[];
  displayName?: string;
}

export interface RuleAction {
  id: string;
  type: 'setPropertyAction' | 'copyPropertiesAction' | 'sendEventAction' | 'updateSegmentAction' | 'sendEmailAction' | 'webhookAction' | 'customAction';
  parameters: {
    [key: string]: unknown;
  };
  displayName?: string;
  description?: string;
}

export interface ActionTemplate {
  label: string;
  icon: LucideIcon;
  description: string;
  type: RuleAction['type'];
  parameters: Record<string, unknown>;
}

export const ACTION_TEMPLATES: Record<string, ActionTemplate> = {
  setProperty: {
    label: 'Set Profile Property',
    icon: Users,
    description: 'Update a profile property with a specific value',
    type: 'setPropertyAction',
    parameters: {
      propertyName: '',
      propertyValue: '',
    },
  },
  copyProperty: {
    label: 'Copy Property',
    icon: Copy,
    description: 'Copy value from one property to another',
    type: 'copyPropertiesAction',
    parameters: {
      fromPropertyName: '',
      toPropertyName: '',
    },
  },
  sendEvent: {
    label: 'Send Event',
    icon: Zap,
    description: 'Trigger a custom event',
    type: 'sendEventAction',
    parameters: {
      eventType: '',
      eventData: {},
    },
  },
  updateSegment: {
    label: 'Update Segment',
    icon: Target,
    description: 'Add or remove profile from segment',
    type: 'updateSegmentAction',
    parameters: {
      segmentId: '',
      action: 'add',
    },
  },
  sendEmail: {
    label: 'Send Email',
    icon: Mail,
    description: 'Send personalized email to profile',
    type: 'sendEmailAction',
    parameters: {
      templateId: '',
      recipientProperty: 'properties.email',
      subject: '',
      personalizeContent: true,
    },
  },
  webhook: {
    label: 'Call Webhook',
    icon: Globe,
    description: 'Send HTTP request to external service',
    type: 'webhookAction',
    parameters: {
      url: '',
      method: 'POST',
      headers: {},
      payload: {},
    },
  },
};

export const EVENT_TYPES = [
  { value: 'view', label: 'Page View', description: 'When a user views a page' },
  { value: 'login', label: 'User Login', description: 'When a user logs in' },
  { value: 'sessionCreated', label: 'Session Created', description: 'When a new session starts' },
  { value: 'profileUpdated', label: 'Profile Updated', description: 'When profile data changes' },
  { value: 'formSubmitted', label: 'Form Submitted', description: 'When a form is submitted' },
  { value: 'purchaseCompleted', label: 'Purchase Completed', description: 'When a purchase is made' },
  { value: 'emailOpened', label: 'Email Opened', description: 'When an email is opened' },
  { value: 'emailClicked', label: 'Email Clicked', description: 'When an email link is clicked' },
  { value: 'custom', label: 'Custom Event', description: 'Custom event type' },
];
