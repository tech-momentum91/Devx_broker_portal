import React, { useCallback, useState } from 'react';
import * as TabMenuHorizontal from '@/components/ui/tab-menu-horizontal';
import * as Popover from '@/components/ui/popover';
import * as Filter from '@/components/ui/filter';
import DashboardFilterDropdown from './dashboard-filter-dropdown';
import { getDefaultDashboardFilterLocalFilters } from '@/constants/dashboard-filter-constants';
import { RiBuilding4Line, RiStackLine } from 'react-icons/ri';

export const DASHBOARD_TAB_OPTIONS = [
  { value: 'managed', label: 'Managed Office', icon: RiBuilding4Line },
  { value: 'design', label: 'Design & Build', icon: RiStackLine },
];

const DashboardStatusTabs = ({
  value = 'managed',
  onValueChange,
  appliedFilters = {},
  onFiltersChange,
  managedCount = 0,
  designCount = 0,
  lockedFilters = {},
}) => {
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  const counts = { managed: managedCount, design: designCount };
  const filters = appliedFilters && typeof appliedFilters === 'object' ? appliedFilters : {};
  const filterCount = (filters.status?.length ?? 0) + (filters.city?.length ?? 0);
  const filterLabel = filterCount > 0 ? `Filter ${filterCount}` : '';

  const handleValueChange = useCallback(
    (newValue) => {
      onValueChange?.(newValue);
    },
    [onValueChange],
  );

  const handleClearAllFilters = (e) => {
    e?.stopPropagation();
    const base = getDefaultDashboardFilterLocalFilters({});
    Object.keys(lockedFilters || {}).forEach((key) => {
      if (lockedFilters[key] && Array.isArray(lockedFilters[key])) {
        base[key] = lockedFilters[key];
      }
    });
    onFiltersChange?.(base);
    setIsFilterDropdownOpen(false);
  };

  return (
    <TabMenuHorizontal.Root value={value} onValueChange={handleValueChange}>
      <div className="w-full border-b border-stroke-soft-200">
        <TabMenuHorizontal.List
          className="w-full min-w-0 gap-6 border-t border-stroke-soft-200"
          wrapperClassName="w-full min-w-0"
        >
          {DASHBOARD_TAB_OPTIONS.map((tab) => {
            const Icon = tab.icon;
            const count = counts[tab.value] ?? 0;
            return (
              <TabMenuHorizontal.Trigger
                key={tab.value}
                value={tab.value}
                className="group h-12 gap-2 px-0 text-label-sm font-medium text-text-sub-600 data-[state=active]:text-text-strong-950"
              >
                <TabMenuHorizontal.Icon as={Icon} className="size-4" />
                <span>{tab.label}</span>
              </TabMenuHorizontal.Trigger>
            );
          })}

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Popover.Root open={isFilterDropdownOpen} onOpenChange={setIsFilterDropdownOpen}>
              <Filter.TriggerButton
                filterCount={filterCount}
                filterLabel={filterLabel}
                onClear={handleClearAllFilters}
                tooltipContent="Filter"
                ariaLabel="Filter submissions"
              />
              <DashboardFilterDropdown
                open={isFilterDropdownOpen}
                appliedFilters={filters}
                onFiltersChange={onFiltersChange}
                onClose={() => setIsFilterDropdownOpen(false)}
                lockedFilters={lockedFilters}
              />
            </Popover.Root>
          </div>
        </TabMenuHorizontal.List>
      </div>
      {DASHBOARD_TAB_OPTIONS.map((tab) => (
        <TabMenuHorizontal.Content
          key={tab.value}
          value={tab.value}
          className="sr-only"
        >
          {tab.label}
        </TabMenuHorizontal.Content>
      ))}
    </TabMenuHorizontal.Root>
  );
};

export default DashboardStatusTabs;
