/**
 * Collapsible Navigation Group Component
 */

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { NavItem, NavItemProps } from './NavItem';

export interface NavGroupProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: NavItemProps[];
  defaultExpanded?: boolean;
  isCollapsed?: boolean;
}

export const NavGroup: React.FC<NavGroupProps> = ({
  id,
  label,
  icon,
  items,
  defaultExpanded = false,
  isCollapsed = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Load saved state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(`sidebar.group.${id}`);
    if (savedState !== null) {
      setIsExpanded(savedState === 'true');
    } else {
      setIsExpanded(defaultExpanded);
    }
  }, [id, defaultExpanded]);

  // Save state to localStorage
  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem(`sidebar.group.${id}`, String(newState));
  };

  // Filter out disabled items for display
  const visibleItems = items.filter(item => !item.disabled);

  // Don't render group if no visible items
  if (visibleItems.length === 0) {
    return null;
  }

  // If collapsed, just show items without group header
  if (isCollapsed) {
    return (
      <div className="mb-1">
        {visibleItems.map((item, index) => (
          <NavItem key={`${item.href}-${index}`} {...item} isCollapsed={isCollapsed} />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-0.5">
      <button
        onClick={toggleExpanded}
        className="w-full flex items-center justify-between py-2 px-2.5 text-sidebar-text font-semibold rounded-lg hover:bg-sidebar-hover transition-base hover:translate-x-1 focus:outline-none focus:ring-2 focus:ring-sidebar-border-strong"
        aria-expanded={isExpanded}
        aria-controls={`nav-group-${id}`}
      >
        <div className="flex items-center gap-2">
          <span className="flex-shrink-0">{icon}</span>
          <span className="text-[0.8125rem]">{label}</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-sidebar-text" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-sidebar-text" />
        )}
      </button>
      <div
        id={`nav-group-${id}`}
        className={`overflow-y-hidden overflow-x-visible transition-slow ${
          isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="pl-2.5 pt-0.5 pr-1">
          {visibleItems.map((item, index) => (
            <NavItem key={`${item.href}-${index}`} {...item} isCollapsed={isCollapsed} />
          ))}
        </div>
      </div>
    </div>
  );
};
