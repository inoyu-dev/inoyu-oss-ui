/**
 * Enhanced Navigation Item Component
 * Supports feature flags and badges
 */

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Lock } from 'lucide-react';
import { FeatureFlags } from '@/config/feature-flags';

// Add keyframe animation for left border
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInFromBottom {
      from {
        transform: scaleY(0);
      }
      to {
        transform: scaleY(1);
      }
    }
  `;
  document.head.appendChild(style);
}

export interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: string | number;
  featureFlag?: keyof FeatureFlags;
  requiresFeature?: string; // Legacy support
  disabled?: boolean;
  disabledReason?: string;
  isCollapsed?: boolean;
  /** When registered via plugin `items`, specifies which group to inject into. */
  targetGroup?: string;
  /** When true, item is only visible to admin users. */
  adminOnly?: boolean;
}

export const NavItem: React.FC<NavItemProps> = ({
  href,
  icon,
  label,
  badge,
  disabled = false,
  disabledReason,
  isCollapsed = false,
}) => {
  const router = useRouter();
  const isActive = router.pathname === href;

  const content = (
    <div
      className={`relative flex items-center justify-between py-1.5 px-2.5 text-sidebar-text font-normal transition-base rounded-lg ${
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : isActive
          ? 'bg-sidebar-active shadow-lg'
          : 'hover:bg-sidebar-hover hover:translate-x-1'
      }`}
      style={{
        borderRadius: 'var(--radius-md)',
      }}
      title={disabled ? disabledReason : undefined}
    >
      <div className="flex items-center flex-1 min-w-0 gap-2">
        <span 
          className={`flex-shrink-0 transition-transform ${
            isActive ? 'scale-[1.1] drop-shadow-md' : 'group-hover:scale-[1.15] group-hover:rotate-[5deg]'
          }`}
        >
          {icon}
        </span>
        {!isCollapsed && label && (
          <span className="truncate text-[0.8125rem]">{label}</span>
        )}
        {!isCollapsed && disabled && (
          <Lock className="h-2.5 w-2.5 flex-shrink-0 text-sidebar-muted" />
        )}
      </div>
      
      {/* Right dot indicator for active state */}
      {isActive && !isCollapsed && (
        <div 
          className="w-1 h-1 bg-sidebar-text rounded-full flex-shrink-0 shadow-glow-white"
        />
      )}
      
      {badge !== undefined && badge !== null && (
        <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-medium bg-sidebar-active text-sidebar-text rounded-full flex-shrink-0">
          {badge}
        </span>
      )}
    </div>
  );

  if (disabled) {
    return <div className="group">{content}</div>;
  }

  // Generate testid from href (e.g., '/profiles' -> 'nav-item-profiles')
  const testId = `nav-item-${href.replace(/^\//, '').replace(/\//g, '-') || 'home'}`;

  return (
    <Link href={href} className="block group overflow-visible" data-testid={testId}>
      {content}
    </Link>
  );
};
