import React, { useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import Image from 'next/image';
import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { NavGroup, NavGroupProps } from './NavGroup';
import { NavItemProps } from './NavItem';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { FeatureFlags } from '@/config/feature-flags';
import { useAdmin } from '@/hooks/useAdmin';
import { useNavigationRegistry } from '@/plugins/useNavigationRegistry';
import { createContext, useContext } from 'react';

// Context for sidebar state
export const SidebarContext = createContext<{
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}>({
  isCollapsed: false,
  setIsCollapsed: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const { featureFlags } = useFeatureFlags();
  const { isAdmin } = useAdmin();
  const { getNavigationExtensions } = useNavigationRegistry();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const SCROLL_POSITION_KEY = 'sidebar-scroll-position';
  const { isCollapsed, setIsCollapsed } = useSidebar();

  // Save scroll position on scroll and navigation
  useEffect(() => {
    const handleRouteChangeStart = () => {
      if (sidebarRef.current) {
        localStorage.setItem(SCROLL_POSITION_KEY, String(sidebarRef.current.scrollTop));
      }
    };

    // Save scroll position on scroll (debounced)
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      if (sidebarRef.current) {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          if (sidebarRef.current) {
            localStorage.setItem(SCROLL_POSITION_KEY, String(sidebarRef.current.scrollTop));
          }
        }, 100);
      }
    };

    const sidebarElement = sidebarRef.current;
    if (sidebarElement) {
      // Listen to scroll events
      sidebarElement.addEventListener('scroll', handleScroll, { passive: true });
    }

    // Listen to route changes
    router.events.on('routeChangeStart', handleRouteChangeStart);

    return () => {
      if (sidebarElement) {
        sidebarElement.removeEventListener('scroll', handleScroll);
      }
      router.events.off('routeChangeStart', handleRouteChangeStart);
      clearTimeout(scrollTimeout);
    };
  }, [router]);

  const navigationGroups: NavGroupProps[] = useMemo(() => {
    // ─── Build navigation from plugin-registered groups ───────────────
    // All groups come from registered plugins.
    // The Sidebar applies feature-flag gating, admin checks, and i18n.

    const pluginNav = getNavigationExtensions();

    /**
     * Apply runtime checks to a raw nav item from a plugin:
     * - i18n translation
     * - Feature-flag gating (disabled + reason)
     * - Admin-only visibility
     */
    const applyItemChecks = (item: NavItemProps): NavItemProps => {
      const flag = item.featureFlag as keyof FeatureFlags | undefined;
      const isEnabled = flag ? (isAdmin || featureFlags[flag]) : true;
      const shouldDisable = item.disabled || (!isEnabled && !isAdmin);
      const reason = shouldDisable && !isAdmin
        ? (item.disabledReason || (flag && !featureFlags[flag] ? 'Not available in this deployment type' : undefined))
        : undefined;

      return {
        ...item,
        label: t(item.label),
        disabled: shouldDisable,
        disabledReason: reason,
      };
    };

    // Process groups: translate labels, apply item checks, merge injected items
    const processedGroups: NavGroupProps[] = pluginNav.groups.map((group) => {
      // Apply checks to each item in the group
      let items = group.items.map(applyItemChecks);

      // Apply replacements/removals from plugin items (keyed by href without leading slash)
      items = items.map((item) => {
        const key = item.href.replace(/^\//, '') || 'home';
        if (pluginNav.removedItems.has(key)) {
          return { ...item, disabled: true };
        }
        if (pluginNav.items[key]) {
          return applyItemChecks({ ...item, ...pluginNav.items[key] });
        }
        return item;
      });

      // Inject items that declare targetGroup matching this group's id
      for (const [, injectedItem] of Object.entries(pluginNav.items)) {
        if (injectedItem.targetGroup !== group.id) continue;
        const alreadyExists = items.some(i => i.href === injectedItem.href);
        if (alreadyExists) continue;
        if (injectedItem.adminOnly && !isAdmin) continue;
        const injectedFlag = injectedItem.featureFlag as keyof FeatureFlags | undefined;
        if (injectedFlag && !featureFlags[injectedFlag]) continue;
        items.push(applyItemChecks(injectedItem));
      }

      return {
        ...group,
        label: t(group.label),
        items,
      };
    });

    // Filter out groups with no visible items
    return processedGroups.filter(group => {
      const visibleItems = group.items.filter(item => !item.disabled);
      return visibleItems.length > 0;
    });
  }, [featureFlags, t, isAdmin, getNavigationExtensions]);

  // Restore scroll position after content is rendered
  useEffect(() => {
    const savedPosition = localStorage.getItem(SCROLL_POSITION_KEY);
    if (savedPosition && sidebarRef.current) {
      // Use a small delay to ensure content is rendered
      const timeoutId = setTimeout(() => {
        if (sidebarRef.current) {
          sidebarRef.current.scrollTop = parseInt(savedPosition, 10);
        }
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [navigationGroups]); // Restore when navigation groups change

  // Update body class for CSS-based layout adjustments
  useEffect(() => {
    if (isCollapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
    return () => {
      document.body.classList.remove('sidebar-collapsed');
    };
  }, [isCollapsed]);

  return (
    <div 
      ref={sidebarRef}
      className={`bg-sidebar-bg fixed top-0 left-0 h-screen flex flex-col z-[1000] transition-base shadow-sidebar border-r border-sidebar-border ${
        isCollapsed ? 'w-20' : 'w-[260px]'
      }`}
      data-testid="sidebar"
    >
      {/* Header Section */}
      <div className="p-3 flex items-center justify-between border-b border-sidebar-border min-h-[60px] flex-shrink-0">
        {!isCollapsed && (
          <div className="flex flex-col gap-0.5">
            <span className="text-base font-extrabold text-sidebar-text tracking-tight drop-shadow-drop-text">
              Customer Data Platform
            </span>
          </div>
        )}
        {isCollapsed && (
          <div className="flex items-center justify-center w-full">
            <div className="w-7 h-7 rounded-lg bg-sidebar-icon-bg flex items-center justify-center">
              <span className="text-sidebar-text font-bold text-[10px]">CDP</span>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-7 h-7 border-2 border-sidebar-border-strong rounded-lg bg-sidebar-icon-bg text-sidebar-text flex items-center justify-center hover:bg-sidebar-icon-bg-hover hover:scale-110 transition-base focus:outline-none focus:ring-2 focus:ring-sidebar-border-strong"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation Section */}
      <nav 
        className="flex-1 p-2 flex flex-col gap-0.5 overflow-y-auto sidebar-scrollbar" 
        data-testid="sidebar-nav"
      >
        {navigationGroups.map((group) => (
          <NavGroup 
            key={group.id} 
            {...group} 
            isCollapsed={isCollapsed}
          />
        ))}
      </nav>

      {/* Footer Section */}
      <div className="p-4 border-t border-sidebar-border flex-shrink-0 bg-white dark:bg-white/5">
        <div className="flex items-center justify-center">
          <Image
            src="/inoyu-logo.svg"
            alt="Inoyu OSS UI Logo"
            width={isCollapsed ? 40 : 120}
            height={isCollapsed ? 40 : 60}
            className={`transition-base ${
              isCollapsed ? 'max-h-[40px]' : 'max-h-[60px]'
            } w-auto opacity-100 dark:invert`}
            style={{
              filter: 'var(--shadow-drop-element)',
            }}
          />
        </div>
      </div>

      <style jsx>{`
        .sidebar-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .sidebar-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--sidebar-border-strong));
          border-radius: 3px;
        }
        .sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--sidebar-active));
        }
      `}</style>
    </div>
  );
};

export default Sidebar;
