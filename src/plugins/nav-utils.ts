/**
 * Shared utilities for plugin navigation definitions.
 *
 * Plugins use this helper to create
 * icon elements with consistent sizing and styling.
 */

import React from 'react';

/**
 * Create a sized icon element for sidebar navigation.
 *
 * @param Icon  Lucide icon component (or any FC accepting className)
 * @param size  'sm' for nav items (3.5), 'md' for group headers (4)
 */
export const navIcon = (
  Icon: React.FC<{ className?: string }>,
  size: 'sm' | 'md' = 'sm'
): React.ReactNode => {
  const cls = size === 'sm'
    ? 'h-3.5 w-3.5 text-sidebar-text'
    : 'h-4 w-4 text-sidebar-text';
  return React.createElement(Icon, { className: cls });
};
