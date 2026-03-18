import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  getDashboardStatusOptions,
  getDashboardCityOptions,
  getLeadSubmissions,
  getCrmStagesForExternal,
} from '@/services/dashboard-service';

const initialState = {
  filterOptions: {
    status: [],
    city: [],
  },
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  submissions: {
    data: [],
    isLoading: false,
    error: null,
    managedCount: 0,
    designCount: 0,
    /** Dashboard summary counts from get_leads_for_cp_contact (Managed Office + Design & Build cards) */
    summary: null,
  },
  /** CRM stages with apply_to_external = true, for lead progress bar */
  externalCrmStages: {
    data: [],
    isLoading: false,
    error: null,
  },
};

const normalizeOption = (opt) =>
  typeof opt === 'object' && opt !== null
    ? { value: opt.value ?? opt.name ?? '', label: opt.label ?? opt.name ?? opt.value ?? '' }
    : { value: String(opt), label: String(opt) };

/**
 * Fetches dashboard filter options (status and city) via separate status and city services.
 */
export const fetchDashboardFilterOptions = createAsyncThunk(
  'dashboard/fetchFilterOptions',
  async (_, { rejectWithValue }) => {
    try {
      const [statusRaw, cityRaw] = await Promise.all([
        getDashboardStatusOptions(),
        getDashboardCityOptions(),
      ]);
      const status = (Array.isArray(statusRaw) ? statusRaw : []).map(normalizeOption).filter((opt) => opt.value && opt.label);
      const city = (Array.isArray(cityRaw) ? cityRaw : []).map(normalizeOption).filter((opt) => opt.value && opt.label);
      return { status, city };
    } catch (error) {
      return rejectWithValue(error?.response?.data ?? error?.message ?? error);
    }
  },
);

/**
 * Fetches lead submissions for the dashboard by tab and filters.
 * @param {{ tab: string, filters: { status?: string[], city?: string[] } }} payload
 */
export const fetchLeadSubmissions = createAsyncThunk(
  'dashboard/fetchLeadSubmissions',
  async ({ tab = 'managed', filters = {} } = {}, { rejectWithValue }) => {
    try {
      return await getLeadSubmissions({ tab, filters });
    } catch (error) {
      const payload = error?.response?.data ?? error?.message ?? error;
      const message =
        typeof payload === 'string'
          ? payload
          : payload?.message ?? payload?.exc ?? 'Failed to load submissions';
      return rejectWithValue(message);
    }
  },
);

/**
 * Fetches CRM stages where apply_to_external is true (for broker portal lead progress bar).
 */
export const fetchCrmStagesForExternal = createAsyncThunk(
  'dashboard/fetchCrmStagesForExternal',
  async (_, { rejectWithValue }) => {
    try {
      return await getCrmStagesForExternal();
    } catch (error) {
      const payload = error?.response?.data ?? error?.message ?? error;
      const message =
        typeof payload === 'string'
          ? payload
          : payload?.message ?? payload?.exc ?? 'Failed to load stages';
      return rejectWithValue(message);
    }
  },
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardFilterOptions.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchDashboardFilterOptions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.filterOptions.status = action.payload?.status ?? [];
        state.filterOptions.city = action.payload?.city ?? [];
        state.error = null;
      })
      .addCase(fetchDashboardFilterOptions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? action.error?.message ?? 'Failed to load filter options';
        state.filterOptions.status = [];
        state.filterOptions.city = [];
      })
      .addCase(fetchLeadSubmissions.pending, (state) => {
        state.submissions.isLoading = true;
        state.submissions.error = null;
      })
      .addCase(fetchLeadSubmissions.fulfilled, (state, action) => {
        state.submissions.isLoading = false;
        state.submissions.error = null;
        state.submissions.data = action.payload?.data ?? [];
        state.submissions.managedCount = action.payload?.managedCount ?? 0;
        state.submissions.designCount = action.payload?.designCount ?? 0;
        state.submissions.summary = action.payload?.summary ?? null;
      })
      .addCase(fetchLeadSubmissions.rejected, (state, action) => {
        state.submissions.isLoading = false;
        state.submissions.error = action.payload ?? action.error?.message ?? 'Failed to load submissions';
        state.submissions.data = [];
        state.submissions.summary = null;
      })
      .addCase(fetchCrmStagesForExternal.pending, (state) => {
        state.externalCrmStages.isLoading = true;
        state.externalCrmStages.error = null;
      })
      .addCase(fetchCrmStagesForExternal.fulfilled, (state, action) => {
        state.externalCrmStages.isLoading = false;
        state.externalCrmStages.error = null;
        state.externalCrmStages.data = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchCrmStagesForExternal.rejected, (state, action) => {
        state.externalCrmStages.isLoading = false;
        state.externalCrmStages.error = action.payload ?? action.error?.message ?? 'Failed to load stages';
        state.externalCrmStages.data = [];
      });
  },
});

export default dashboardSlice.reducer;
export const selectDashboardFilterOptions = (state) =>
  state.dashboard?.filterOptions ?? { status: [], city: [] };
export const selectDashboardFilterOptionsStatus = (state) =>
  state.dashboard?.status ?? 'idle';
export const selectDashboardFilterOptionsError = (state) =>
  state.dashboard?.error ?? null;

export const selectSubmissions = (state) =>
  state.dashboard?.submissions ?? {
    data: [],
    isLoading: false,
    error: null,
    managedCount: 0,
    designCount: 0,
    summary: null,
  };

/** Dashboard summary for Managed Office + Design & Build cards (from get_leads_for_cp_contact). */
export const selectDashboardSummary = (state) => state.dashboard?.submissions?.summary ?? null;

export const selectExternalCrmStages = (state) =>
  state.dashboard?.externalCrmStages ?? {
    data: [],
    isLoading: false,
    error: null,
  };
