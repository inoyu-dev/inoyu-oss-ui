/**
 * RegistryPage — Plugin-aware page wrapper.
 *
 * Checks the PluginRegistry for a page replacement at the given route.
 * If a plugin has registered a component for this route, renders that;
 * otherwise renders the default content.
 *
 * Wraps content in ProtectedRoute + Layout for consistency.
 *
 * Usage:
 *   <RegistryPage route="/segments" defaultComponent={SegmentList} />
 *   <RegistryPage route="/rules" defaultComponent={RulesList} title="Rules" />
 */

import React, { type ComponentType } from 'react';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { usePageRegistry } from '@/plugins/usePageRegistry';

export interface RegistryPageProps {
  /** Route key used for plugin lookup (e.g. '/segments', '/rules') */
  route: string;
  /** Default component rendered when no plugin overrides this route */
  defaultComponent: ComponentType;
  /** Optional page title rendered as h1 above the component */
  title?: string;
  /** Optional wrapper className applied around the content */
  className?: string;
}

export default function RegistryPage({
  route,
  defaultComponent: DefaultComponent,
  title,
  className,
}: RegistryPageProps) {
  const { getPageComponent } = usePageRegistry();

  // Check if any plugin provides a replacement for this route
  const PluginPage = getPageComponent(route, DefaultComponent);
  const PageContent = PluginPage ?? DefaultComponent;

  return (
    <ProtectedRoute>
      <Layout>
        {className ? (
          <div className={className}>
            {title && <h1>{title}</h1>}
            <PageContent />
          </div>
        ) : (
          <>
            {title && <h1>{title}</h1>}
            <PageContent />
          </>
        )}
      </Layout>
    </ProtectedRoute>
  );
}
