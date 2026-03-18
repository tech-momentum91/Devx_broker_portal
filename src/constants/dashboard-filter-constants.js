export const DASHBOARD_FILTER_TABS = {
  STATUS: 'status',
  CITY: 'city',
};

export const DASHBOARD_FILTER_TAB_CONFIG = [
  { value: DASHBOARD_FILTER_TABS.STATUS, label: 'Status' },
  { value: DASHBOARD_FILTER_TABS.CITY, label: 'City' },
];

/** Static fallback when API has not returned yet; Redux options (stages + cities from API) take precedence. */
export const DASHBOARD_FILTER_OPTIONS_FALLBACK = {
  [DASHBOARD_FILTER_TABS.STATUS]: [],
  [DASHBOARD_FILTER_TABS.CITY]: [],
};

const ensureFilterArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (value === null || value === undefined || value === '') return [];
  return [String(value)];
};

export const getDefaultDashboardFilterLocalFilters = (filters = {}) => ({
  status: ensureFilterArray(filters.status),
  city: ensureFilterArray(filters.city),
});
