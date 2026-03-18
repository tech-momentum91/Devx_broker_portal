import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import apiClient from '@/api/axios';

const RESOURCE_TYPE_DOCTYPE = 'Resource Type';
const RESOURCE_TYPE_NAME_FIELD = 'resource_type_name';
const RESOURCE_TYPE_DISABLE_FIELD = 'disable';

const initialState = {
  resourceTypes: {
    data: [], // [{ value, label }]
    isLoading: false,
    error: null,
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  },
};

export const fetchResourceTypes = createAsyncThunk(
  'common/fetchResourceTypes',
  async (_, { rejectWithValue }) => {
    try {
      const payload = {
        doctype: RESOURCE_TYPE_DOCTYPE,
        keyword: '',
        filters: [[RESOURCE_TYPE_DISABLE_FIELD, '!=', 1]],
        limit_page_length: 500,
        page: 1,
        order_by: `${RESOURCE_TYPE_NAME_FIELD} asc`,
      };

      const response = await apiClient.post(
        '/method/devx.api.listview.list_with_search_filters',
        payload,
      );

      const message = response?.data?.message || {};
      const rawData = Array.isArray(message.results)
        ? message.results
        : Array.isArray(message.data)
          ? message.data
          : Array.isArray(message)
            ? message
            : [];

      const options = rawData
        .map((row) => ({
          value: row.name ?? '',
          label: row[RESOURCE_TYPE_NAME_FIELD] ?? row.name ?? '',
        }))
        .filter((opt) => opt.value && opt.label);

      return options;
    } catch (error) {
      return rejectWithValue(error?.response?.data || error?.message || error);
    }
  },
);

const commonSlice = createSlice({
  name: 'common',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchResourceTypes.pending, (state) => {
        state.resourceTypes.status = 'loading';
        state.resourceTypes.isLoading = true;
        state.resourceTypes.error = null;
      })
      .addCase(fetchResourceTypes.fulfilled, (state, action) => {
        state.resourceTypes.status = 'succeeded';
        state.resourceTypes.isLoading = false;
        state.resourceTypes.data = action.payload ?? [];
        state.resourceTypes.error = null;
      })
      .addCase(fetchResourceTypes.rejected, (state, action) => {
        state.resourceTypes.status = 'failed';
        state.resourceTypes.isLoading = false;
        state.resourceTypes.error =
          action.payload ?? action.error?.message ?? 'Failed to load resource types';
        state.resourceTypes.data = [];
      });
  },
});

export const selectResourceTypes = (state) => state.common.resourceTypes;
export const selectResourceTypesData = (state) => state.common.resourceTypes.data;
export const selectResourceTypesLoading = (state) => state.common.resourceTypes.isLoading;

export default commonSlice.reducer;
