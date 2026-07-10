/**
 * SearchAndFilterBar — Reusable search input, enabled/disabled filter cycle, and refresh button.
 *
 * Used by entity list components (GoalList, CampaignList, UserListList, etc.) to avoid
 * duplicating the same search + filter + refresh UI.
 */

import React from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export interface SearchAndFilterBarProps {
  /** Current search term */
  searchTerm: string;
  /** Called when the user changes the search input */
  onSearchChange: (term: string) => void;
  /** Current filter: null = all, true = enabled, false = disabled */
  filterEnabled: boolean | null;
  /** Called when the user cycles the filter (All → Enabled → Disabled → All) */
  onCycleFilter: () => void;
  /** Called when the user clicks refresh */
  onRefresh: () => void;
  /** Placeholder for search input. Default: 'Search...' */
  searchPlaceholder?: string;
  /** Whether to show the enabled/disabled filter button. Default: true */
  showFilter?: boolean;
}

/**
 * Bar with search input, optional enabled/disabled filter cycle, and refresh button.
 */
const SearchAndFilterBar: React.FC<SearchAndFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  filterEnabled,
  onCycleFilter,
  onRefresh,
  searchPlaceholder,
  showFilter = true,
}) => {
  const { t } = useTranslation();
  const placeholder = searchPlaceholder ?? t('Search...');

  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 w-64"
        />
      </div>
      {showFilter && (
        <Button variant="outline" size="sm" onClick={onCycleFilter}>
          <Filter className="h-4 w-4 mr-2" />
          {filterEnabled === null
            ? t('All')
            : filterEnabled
              ? t('Enabled')
              : t('Disabled')}
        </Button>
      )}
      <Button variant="outline" size="sm" onClick={onRefresh}>
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default SearchAndFilterBar;
