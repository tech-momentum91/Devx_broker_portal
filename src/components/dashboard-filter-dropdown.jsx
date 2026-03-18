import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RiArrowRightSLine } from 'react-icons/ri';
import * as Filter from '@/components/ui/filter';
import * as TabMenuVertical from '@/components/ui/tab-menu-vertical';
import * as Badge from '@/components/ui/badge';
import {
  fetchDashboardFilterOptions,
  selectDashboardFilterOptions,
  selectDashboardFilterOptionsStatus,
} from '@/redux/dashboardSlice';
import {
  DASHBOARD_FILTER_TABS,
  DASHBOARD_FILTER_TAB_CONFIG,
  DASHBOARD_FILTER_OPTIONS_FALLBACK,
  getDefaultDashboardFilterLocalFilters,
} from '@/constants/dashboard-filter-constants';

const DashboardFilterDropdown = React.forwardRef(
  (
    {
      open,
      onFiltersChange,
      appliedFilters = {},
      setFilterCount,
      lockedFilters = {},
      onClose,
    },
    ref,
  ) => {
    const dispatch = useDispatch();
    const filterOptions = useSelector(selectDashboardFilterOptions);
    const optionsStatus = useSelector(selectDashboardFilterOptionsStatus);

    const [activeTab, setActiveTab] = useState(DASHBOARD_FILTER_TABS.STATUS);
    const [searchText, setSearchText] = useState('');
    const [localFilters, setLocalFilters] = useState(() =>
      getDefaultDashboardFilterLocalFilters(appliedFilters),
    );

    const prevOpenRef = useRef(open);
    const prevOpenForSyncRef = useRef(open);

    useEffect(() => {
      if (!open) return;
      const firstTab = DASHBOARD_FILTER_TAB_CONFIG[0]?.value ?? DASHBOARD_FILTER_TABS.STATUS;
      setActiveTab(firstTab);
    }, [open]);

    useEffect(() => {
      if (!open) return;
      if (optionsStatus === 'idle') {
        dispatch(fetchDashboardFilterOptions());
      }
    }, [open, dispatch, optionsStatus]);

    useEffect(() => {
      if (!open) {
        prevOpenForSyncRef.current = false;
        return;
      }
      const justOpened = prevOpenForSyncRef.current === false;
      prevOpenForSyncRef.current = true;
      if (!justOpened) return;
      const next = getDefaultDashboardFilterLocalFilters(appliedFilters);
      Object.keys(lockedFilters || {}).forEach((key) => {
        if (lockedFilters[key] && Array.isArray(lockedFilters[key])) {
          next[key] = lockedFilters[key];
        }
      });
      setLocalFilters(next);
    }, [open, appliedFilters, lockedFilters]);

    useEffect(() => {
      setSearchText('');
    }, [activeTab]);

    useEffect(() => {
      if (!open) return;
      const count = localFilters.status.length + localFilters.city.length;
      setFilterCount?.(count);
    }, [open, localFilters, setFilterCount]);

    const buildFiltersObject = useCallback(
      (source) => {
        const f = source ?? localFilters;
        const built = {
          status: f.status,
          city: f.city,
        };
        Object.keys(lockedFilters || {}).forEach((key) => {
          if (lockedFilters[key] && Array.isArray(lockedFilters[key])) {
            built[key] = lockedFilters[key];
          }
        });
        return built;
      },
      [localFilters, lockedFilters],
    );

    const handlePopoverClose = useCallback(() => {
      const newFilters = buildFiltersObject();
      const appliedBuilt = buildFiltersObject(
        getDefaultDashboardFilterLocalFilters(appliedFilters),
      );
      if (JSON.stringify(newFilters) !== JSON.stringify(appliedBuilt)) {
        onFiltersChange?.(newFilters);
      }
      onClose?.();
    }, [buildFiltersObject, onFiltersChange, appliedFilters, onClose]);

    const handleClear = useCallback(() => {
      const base = getDefaultDashboardFilterLocalFilters({});
      Object.keys(lockedFilters || {}).forEach((key) => {
        if (lockedFilters[key] && Array.isArray(lockedFilters[key])) {
          base[key] = lockedFilters[key];
        }
      });
      setLocalFilters(base);
      setSearchText('');
      const firstTab = DASHBOARD_FILTER_TAB_CONFIG[0]?.value ?? DASHBOARD_FILTER_TABS.STATUS;
      setActiveTab(firstTab);
    }, [lockedFilters]);

    useImperativeHandle(ref, () => ({
      handleClose: handlePopoverClose,
    }));

    useEffect(() => {
      if (prevOpenRef.current && !open) {
        handlePopoverClose();
      }
      prevOpenRef.current = open;
    }, [open, handlePopoverClose]);

    const tabConfig = useMemo(() => {
      const lockedKeys = Object.keys(lockedFilters).filter(
        (k) =>
          lockedFilters[k] &&
          Array.isArray(lockedFilters[k]) &&
          lockedFilters[k].length > 0,
      );
      if (lockedKeys.length === 0) return DASHBOARD_FILTER_TAB_CONFIG;
      return DASHBOARD_FILTER_TAB_CONFIG.filter((tab) => !lockedKeys.includes(tab.value));
    }, [lockedFilters]);

    const currentOptions = useMemo(() => {
      const fromRedux = filterOptions[activeTab] ?? [];
      const fallback = DASHBOARD_FILTER_OPTIONS_FALLBACK[activeTab] ?? [];
      const options = fromRedux.length > 0 ? fromRedux : fallback;
      const normalized = options.map((opt) => ({
        value: typeof opt === 'object' ? opt.value : opt,
        label: typeof opt === 'object' ? opt.label : opt,
      }));
      if (!searchText.trim()) return normalized;
      const needle = searchText.toLowerCase().trim();
      return normalized.filter(
        (opt) =>
          String(opt.label).toLowerCase().includes(needle) ||
          String(opt.value).toLowerCase().includes(needle),
      );
    }, [activeTab, searchText, filterOptions]);

    const selectedValuesForTab = useMemo(() => {
      if (!localFilters[activeTab]) return [];
      return localFilters[activeTab];
    }, [activeTab, localFilters]);

    const handleToggle = useCallback(
      (value) => {
        setLocalFilters((prev) => {
          const current = prev[activeTab] || [];
          const isSelected = current.includes(value);
          const nextValues = isSelected
            ? current.filter((v) => v !== value)
            : [...current, value];
          return { ...prev, [activeTab]: nextValues };
        });
      },
      [activeTab],
    );

    const isLoading = optionsStatus === 'loading';

    if (!open) return null;

    return (
      <Filter.Root
        onInteractOutside={handlePopoverClose}
        onEscapeKeyDown={handlePopoverClose}
        className="p-0"
        align="end"
        side="bottom"
        sideOffset={8}
        showArrow={false}
      >
        <Filter.Header title="FILTERS" onClear={handleClear} />

        <Filter.Body>
          <Filter.Sidebar width="200px">
            <TabMenuVertical.Root value={activeTab} onValueChange={setActiveTab}>
              <TabMenuVertical.List className="p-2 border-r-0">
                {tabConfig.map((tab) => {
                  const count = localFilters[tab.value]?.length || 0;
                  return (
                    <TabMenuVertical.Trigger
                      className="w-full flex items-center justify-between"
                      key={tab.value}
                      value={tab.value}
                    >
                      {tab.label}
                      {count > 0 ? (
                        <Badge.Root
                          size="medium"
                          variant="filled"
                          className="shrink-0 rounded-full bg-black text-white"
                        >
                          {count}
                        </Badge.Root>
                      ) : (
                        <TabMenuVertical.ArrowIcon as={RiArrowRightSLine} />
                      )}
                    </TabMenuVertical.Trigger>
                  );
                })}
              </TabMenuVertical.List>
            </TabMenuVertical.Root>
          </Filter.Sidebar>

          <Filter.Content width="340px">
            <Filter.List
              options={currentOptions}
              selectedValues={selectedValuesForTab}
              onToggle={handleToggle}
              searchValue={searchText}
              onSearchChange={setSearchText}
              virtualized
              isLoading={isLoading}
              emptyMessage={`No ${activeTab} found`}
            />
          </Filter.Content>
        </Filter.Body>
      </Filter.Root>
    );
  },
);

DashboardFilterDropdown.displayName = 'DashboardFilterDropdown';

export default DashboardFilterDropdown;
export { DASHBOARD_FILTER_TABS };
