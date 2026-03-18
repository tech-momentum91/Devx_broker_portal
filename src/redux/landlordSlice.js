import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import apiClient from '@/api/axios';

const LANDLORD_DOCTYPE = 'Landlord';

const initialState = {
  landlordListData: {
    data: [],
    isLoading: false,
    error: null,
    totalCount: 0,
    currentPage: 1,
    pageSize: 20,
    hasMore: false,
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    statusCounts: {},
  },

  createLandlordDrawer: {
    isOpen: false,
    new_landlord: null,
    error: null,
    status: null,
  },

  viewLandlordDrawer: {
    isOpen: false,
    selectedLandlord: null,
  },

  editLandlordDrawer: {
    isOpen: false,
    selectedLandlord: null,
  },

  removeLandlordDrawer: {
    isOpen: false,
    selectedLandlord: null,
    isLoading: false,
    error: null,
  },

  landlordDetail: {
    data: null,
    isLoading: false,
    error: null,
    status: 'idle',
  },
};

export const getLandlordDetailThunk = createAsyncThunk(
  'landlord/getLandlordDetail',
  async (landlordId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/resource/Landlord/${landlordId}`, {
        params: { expand_links: true },
      });
      const payload = response?.data;
      return payload?.data ?? payload ?? null;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const createLandlordThunk = createAsyncThunk(
  'landlord/createLandlord',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/resource/Landlord', payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getLandlordListThunk = createAsyncThunk(
  'landlord/getLandlordList',
  async (
    {
      keyword = '',
      status = '',
      filters = [],
      type = '',
      page = 1,
      pageSize = 20,
      append = false,
      order_by = 'creation desc',
    } = {},
    { rejectWithValue },
  ) => {
    try {
      const formData = new FormData();
      formData.append('doctype', 'Landlord');

      // Special lightweight call used in a few legacy places (e.g. centerSpaces)
      if (type === 'centerSpaces') {
        const response = await apiClient.post(
          '/method/devx.api.listview.list_with_search_filters',
          {
            doctype: 'Landlord',
            // order_by: 'creation desc',
          },
        );
        return response.data;
      }

      // Build filters array - use provided filters or build from status
      let filtersArray = [];

      // If filters are provided directly, use them
      if (Array.isArray(filters) && filters.length > 0) {
        filtersArray = filters;
      } else if (status && status !== 'all') {
        // Otherwise, build filters from status parameter (any non-"all" value)
        filtersArray.push(['status', '=', status]);
      }

      formData.append('limit_page_length', String(pageSize));
      formData.append('page', String(page));
      formData.append('order_by', order_by);

      // Always use list_with_search_filters API (matches curl example)
      if (filtersArray.length > 0) {
        formData.append('filters', JSON.stringify(filtersArray));
      }

      if (keyword.trim()) {
        formData.append('keyword', keyword.trim());
      }

      const response = await apiClient.post(
        '/method/devx.api.listview.list_with_search_filters',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );

      const responseData = response?.data?.message || response?.data || {};
      const results = responseData.results || responseData.data || responseData || [];
      const totalCount = responseData.total_count ?? responseData.count ?? results.length;
      const statusCounts = responseData.status_counts || {};

      // Extract pagination info from API response
      const apiPage = responseData.page ?? page;
      const apiPageSize = responseData.page_size ?? pageSize;
      const apiCount = responseData.count ?? results.length;

      // Calculate currentCount: total items loaded so far
      const itemsLoadedSoFar = (apiPage - 1) * apiPageSize + apiCount;

      let currentCount;
      if (append) {
        currentCount = responseData.current_count ?? itemsLoadedSoFar;
      } else {
        currentCount = itemsLoadedSoFar;
      }

      // Calculate hasMore
      const hasMoreFromAPI = responseData.has_more;
      let hasMore;

      if (hasMoreFromAPI !== undefined) {
        hasMore = hasMoreFromAPI;
      } else if (totalCount !== undefined && totalCount > 0) {
        hasMore = apiCount === apiPageSize && itemsLoadedSoFar < totalCount;
      } else {
        hasMore = apiCount === apiPageSize;
      }

      return {
        results,
        page,
        pageSize,
        append,
        hasMore,
        totalCount,
        current_count: currentCount,
        statusCounts,
        message: responseData,
        status: response?.data?.status || response?.status || 200,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

// Map frontend column IDs to backend field names for sorting
const mapLandlordOrderByToBackend = (orderBy) => {
  if (!orderBy || typeof orderBy !== 'string') {
    return orderBy;
  }

  const parts = orderBy.trim().split(/\s+/);
  if (parts.length === 0) {
    return orderBy;
  }

  const frontendField = parts[0];
  const direction = parts.length > 1 ? parts.slice(1).join(' ') : 'desc';

  const fieldMap = {
    name: 'landlord_name',
    // spoc: 'spoc', // NOTE: SPOC intentionally disabled for now (kept for future reuse).
    contact_number: 'contact_number',
    email: 'email_address',
  };

  const backendField = fieldMap[frontendField] || frontendField;
  return `${backendField} ${direction}`;
};

// Dedicated thunk for backend sorting (used by Landlords table only)
export const getLandlordListSortingThunk = createAsyncThunk(
  'landlord/getLandlordListSorting',
  async (
    {
      keyword = '',
      status = 'all',
      filters = [],
      sorting = [],
      page = 1,
      pageSize = 20,
      append = false,
    } = {},
    { rejectWithValue },
  ) => {
    try {
      const formData = new FormData();
      formData.append('doctype', 'Landlord');

      // Build filters array - use provided filters or build from status
      let filtersArray = [];
      if (Array.isArray(filters) && filters.length > 0) {
        filtersArray = filters;
      } else if (status && status !== 'all' && (status === 'Active' || status === 'Inactive')) {
        filtersArray.push(['status', '=', status]);
      }

      if (keyword?.trim()) {
        formData.append('keyword', keyword.trim());
      }

      if (filtersArray.length > 0) {
        formData.append('filters', JSON.stringify(filtersArray));
      }

      formData.append('limit_page_length', String(pageSize));
      formData.append('page', String(page));

      // Convert TanStack sorting state to backend order_by
      let orderBy = 'creation desc';
      if (Array.isArray(sorting) && sorting.length > 0) {
        const sortField = sorting[0].id;
        const sortOrder = sorting[0].desc ? 'desc' : 'asc';
        orderBy = mapLandlordOrderByToBackend(`${sortField} ${sortOrder}`);
      }

      formData.append('order_by', orderBy);

      const response = await apiClient.post(
        '/method/devx.api.listview.list_with_search_filters',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );

      const responseData = response?.data?.message || response?.data || {};
      const results = responseData.results || responseData.data || responseData || [];
      const totalCount = responseData.total_count ?? results.length;
      const currentCount = append ? (responseData.current_count ?? results.length) : results.length;
      const hasMore = currentCount < totalCount || results.length === pageSize;

      return {
        results,
        page,
        pageSize,
        append,
        hasMore,
        totalCount,
        message: responseData,
        status: response?.data?.status || response?.status || 200,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const updateLandlordThunk = createAsyncThunk(
  'landlord/updateLandlord',
  async ({ landlord_id, payload }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/resource/Landlord/${landlord_id}`, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const deleteLandlordThunk = createAsyncThunk(
  'landlord/deleteLandlord',
  async ({ landlord_id }, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/resource/Landlord/${landlord_id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getLandlordListSeperateThunk = createAsyncThunk(
  'landlord/getLandlordListSeperate',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(
        '/method/devx.api.listview.list_with_search_filters',
        formData,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const updateLandlordColumnList = createAsyncThunk(
  'landlord/updateLandlordColumnList',
  async (body, thunkAPI) => {
    try {
      const response = await apiClient.post('/method/devx.api.listview.save_list_pref', {
        doctype: LANDLORD_DOCTYPE,
        columns: body,
      });
      return response?.data?.message;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.serialized || error);
    }
  },
);

export const fetchLandlordColumnList = createAsyncThunk(
  'landlord/fetchLandlordColumnList',
  async (_, thunkAPI) => {
    try {
      const response = await apiClient.get('/method/devx.api.listview.get_list_pref', {
        params: {
          doctype: LANDLORD_DOCTYPE,
        },
      });
      return response?.data?.message;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.serialized || error);
    }
  },
);

const landlordSlice = createSlice({
  name: 'landlord',
  initialState,
  reducers: {
    setCreateLandlordDrawer: (state, action) => {
      state.createLandlordDrawer.isOpen =
        typeof action.payload === 'boolean' ? action.payload : !state.createLandlordDrawer.isOpen;
    },
    setViewLandlordDrawer: (state, action) => {
      if (typeof action.payload === 'boolean') {
        state.viewLandlordDrawer.isOpen = action.payload;
        if (!action.payload) {
          state.viewLandlordDrawer.selectedLandlord = null;
        }
      } else if (action.payload?.landlord) {
        state.viewLandlordDrawer.isOpen = true;
        state.viewLandlordDrawer.selectedLandlord = action.payload.landlord;
      } else {
        state.viewLandlordDrawer.isOpen = !state.viewLandlordDrawer.isOpen;
        if (!state.viewLandlordDrawer.isOpen) {
          state.viewLandlordDrawer.selectedLandlord = null;
        }
      }
    },
    setEditLandlordDrawer: (state, action) => {
      if (typeof action.payload === 'boolean') {
        state.editLandlordDrawer.isOpen = action.payload;
        if (!action.payload) {
          state.editLandlordDrawer.selectedLandlord = null;
        }
      } else if (action.payload?.landlord) {
        state.editLandlordDrawer.isOpen = true;
        state.editLandlordDrawer.selectedLandlord = action.payload.landlord;
      } else {
        state.editLandlordDrawer.isOpen = !state.editLandlordDrawer.isOpen;
        if (!state.editLandlordDrawer.isOpen) {
          state.editLandlordDrawer.selectedLandlord = null;
        }
      }
    },
    setRemoveLandlordDrawer: (state, action) => {
      if (typeof action.payload === 'boolean') {
        state.removeLandlordDrawer.isOpen = action.payload;
        if (!action.payload) {
          state.removeLandlordDrawer.selectedLandlord = null;
        }
      } else if (action.payload?.landlord) {
        state.removeLandlordDrawer.isOpen = true;
        state.removeLandlordDrawer.selectedLandlord = action.payload.landlord;
      } else {
        state.removeLandlordDrawer.isOpen = !state.removeLandlordDrawer.isOpen;
        if (!state.removeLandlordDrawer.isOpen) {
          state.removeLandlordDrawer.selectedLandlord = null;
        }
      }
    },
    setRemoveNewLandlord: (state, action) => {
      state.createLandlordDrawer.new_landlord = null;
    },
    resetLandlordList: (state) => {
      state.landlordListData.data = [];
      state.landlordListData.currentPage = 1;
      state.landlordListData.hasMore = false;
      state.landlordListData.error = null;
    },
    resetLandlordDetail: (state) => {
      state.landlordDetail.data = null;
      state.landlordDetail.isLoading = false;
      state.landlordDetail.error = null;
      state.landlordDetail.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    /* Landlord List */
    builder
      .addCase(getLandlordListThunk.pending, (state) => {
        state.landlordListData.status = 'loading';
        state.landlordListData.isLoading = true;
        state.landlordListData.error = null;
      })
      .addCase(getLandlordListThunk.fulfilled, (state, { payload }) => {
        state.landlordListData.status = 'succeeded';
        state.landlordListData.isLoading = false;
        state.landlordListData.error = null;

        // Handle pagination response
        if (payload?.results) {
          const results = payload.results;
          const { append, page, pageSize, hasMore, totalCount, current_count, statusCounts } =
            payload;

          if (statusCounts && Object.keys(statusCounts).length > 0 && !append) {
            state.landlordListData.statusCounts = statusCounts;
          }

          if (append) {
            // Append to existing data, avoiding duplicates
            const existingData = state.landlordListData.data || [];
            const existingIds = new Set(existingData.map((item) => item.name || item.id));
            const newResults = results.filter((item) => !existingIds.has(item.name || item.id));
            state.landlordListData.data = [...existingData, ...newResults];

            // Recalculate hasMore based on current_count from API response
            if (current_count !== undefined && totalCount !== undefined) {
              state.landlordListData.hasMore = current_count < totalCount;
            } else if (hasMore !== undefined) {
              state.landlordListData.hasMore = hasMore;
            } else {
              const calculatedCurrentCount = state.landlordListData.data.length;
              state.landlordListData.hasMore = calculatedCurrentCount < totalCount;
            }
          } else {
            // Replace data for new search/filter
            state.landlordListData.data = results;

            // For non-append operations, use hasMore from payload
            if (hasMore !== undefined) {
              state.landlordListData.hasMore = hasMore;
            } else {
              const dataLength = Array.isArray(results) ? results.length : 0;
              state.landlordListData.hasMore = dataLength === pageSize && dataLength < totalCount;
            }
          }
          state.landlordListData.currentPage = page;
          state.landlordListData.pageSize = pageSize;
          state.landlordListData.totalCount = totalCount;
        } else if (Array.isArray(payload)) {
          state.landlordListData.data = payload;
          state.landlordListData.currentPage = 1;
          state.landlordListData.hasMore = false;
        } else if (payload?.message?.results) {
          state.landlordListData.data = payload.message.results;
          state.landlordListData.currentPage = 1;
          state.landlordListData.hasMore = false;
        } else if (Array.isArray(payload?.message)) {
          state.landlordListData.data = payload.message;
          state.landlordListData.currentPage = 1;
          state.landlordListData.hasMore = false;
        } else if (Array.isArray(payload?.data)) {
          state.landlordListData.data = payload.data;
          state.landlordListData.currentPage = 1;
          state.landlordListData.hasMore = false;
        } else {
          state.landlordListData.data = [];
          state.landlordListData.currentPage = 1;
          state.landlordListData.hasMore = false;
        }
      })
      .addCase(getLandlordListThunk.rejected, (state, action) => {
        state.landlordListData.status = 'failed';
        state.landlordListData.isLoading = false;
        state.landlordListData.error = action.payload;
      });

    builder
      .addCase(getLandlordListSortingThunk.pending, (state) => {
        state.landlordListData.status = 'loading';
        state.landlordListData.isLoading = true;
        state.landlordListData.error = null;
      })
      .addCase(getLandlordListSortingThunk.fulfilled, (state, { payload }) => {
        state.landlordListData.status = 'succeeded';
        state.landlordListData.isLoading = false;
        state.landlordListData.error = null;

        // Handle pagination response
        if (payload?.results) {
          const results = payload.results;
          const { append, page, pageSize, hasMore, totalCount, current_count } = payload;

          if (append) {
            // Append to existing data, avoiding duplicates
            const existingData = state.landlordListData.data || [];
            const existingIds = new Set(existingData.map((item) => item.name || item.id));
            const newResults = results.filter((item) => !existingIds.has(item.name || item.id));
            state.landlordListData.data = [...existingData, ...newResults];

            // Recalculate hasMore based on current_count from API response
            // This is the most accurate way as it uses the API's calculation
            if (current_count !== undefined && totalCount !== undefined) {
              // Use API's current_count if provided (calculated as: (page - 1) * page_size + count)
              state.landlordListData.hasMore = current_count < totalCount;
            } else if (hasMore !== undefined) {
              // Fallback to hasMore from payload if current_count not available
              state.landlordListData.hasMore = hasMore;
            } else {
              // Final fallback: calculate from data length
              const calculatedCurrentCount = state.landlordListData.data.length;
              state.landlordListData.hasMore = calculatedCurrentCount < totalCount;
            }
          } else {
            // Replace data for new search/filter
            state.landlordListData.data = results;

            // For non-append operations, use hasMore from payload
            if (hasMore !== undefined) {
              state.landlordListData.hasMore = hasMore;
            } else {
              // Fallback: calculate hasMore if not provided
              const dataLength = Array.isArray(results) ? results.length : 0;
              state.landlordListData.hasMore = dataLength === pageSize && dataLength < totalCount;
            }
          }
          state.landlordListData.currentPage = page;
          state.landlordListData.pageSize = pageSize;
          state.landlordListData.totalCount = totalCount;
        } else if (Array.isArray(payload)) {
          state.landlordListData.data = payload;
          state.landlordListData.currentPage = 1;
          state.landlordListData.hasMore = false;
        } else if (payload?.message?.results) {
          state.landlordListData.data = payload.message.results;
          state.landlordListData.currentPage = 1;
          state.landlordListData.hasMore = false;
        } else if (Array.isArray(payload?.message)) {
          state.landlordListData.data = payload.message;
          state.landlordListData.currentPage = 1;
          state.landlordListData.hasMore = false;
        } else if (Array.isArray(payload?.data)) {
          state.landlordListData.data = payload.data;
          state.landlordListData.currentPage = 1;
          state.landlordListData.hasMore = false;
        } else {
          state.landlordListData.data = [];
          state.landlordListData.currentPage = 1;
          state.landlordListData.hasMore = false;
        }
      })
      .addCase(getLandlordListSortingThunk.rejected, (state, action) => {
        state.landlordListData.status = 'failed';
        state.landlordListData.isLoading = false;
        state.landlordListData.error = action.payload;
      });

    builder.addCase(createLandlordThunk.pending, (state) => {
      state.createLandlordDrawer.isLoading = true;
      state.createLandlordDrawer.error = null;
      state.createLandlordDrawer.status = null;
    });
    builder.addCase(createLandlordThunk.fulfilled, (state, { payload }) => {
      state.createLandlordDrawer.isLoading = false;
      state.createLandlordDrawer.new_landlord = payload;
      state.createLandlordDrawer.status = payload.status;
    });
    builder.addCase(createLandlordThunk.rejected, (state, action) => {
      state.createLandlordDrawer.isLoading = false;
      state.createLandlordDrawer.error = action.payload;
    });

    builder.addCase(updateLandlordThunk.pending, (state) => {
      state.landlordListData.isLoading = true;
      state.landlordListData.error = null;
    });
    builder.addCase(updateLandlordThunk.fulfilled, (state, action) => {
      state.landlordListData.data = action?.payload?.data;
      state.landlordListData.isLoading = false;
      state.landlordListData.error = null;
    });
    builder.addCase(updateLandlordThunk.rejected, (state, action) => {
      state.landlordListData.isLoading = false;
      state.landlordListData.error = action.payload;
    });
    builder.addCase(deleteLandlordThunk.pending, (state) => {
      state.removeLandlordDrawer.isLoading = true;
      state.removeLandlordDrawer.error = null;
    });
    builder.addCase(deleteLandlordThunk.fulfilled, (state) => {
      state.removeLandlordDrawer.isLoading = false;
      state.removeLandlordDrawer.error = null;
    });
    builder.addCase(deleteLandlordThunk.rejected, (state, action) => {
      state.removeLandlordDrawer.isLoading = false;
      state.removeLandlordDrawer.error = action.payload;
    });
    /* Landlord Detail */
    builder
      .addCase(getLandlordDetailThunk.pending, (state) => {
        state.landlordDetail.status = 'loading';
        state.landlordDetail.isLoading = true;
        state.landlordDetail.error = null;
      })
      .addCase(getLandlordDetailThunk.fulfilled, (state, { payload }) => {
        state.landlordDetail.status = 'succeeded';
        state.landlordDetail.isLoading = false;
        state.landlordDetail.error = null;
        state.landlordDetail.data = payload;
      })
      .addCase(getLandlordDetailThunk.rejected, (state, action) => {
        state.landlordDetail.status = 'failed';
        state.landlordDetail.isLoading = false;
        state.landlordDetail.error = action.payload;
        state.landlordDetail.data = null;
      });
  },
});

export const {
  setCreateLandlordDrawer,
  setViewLandlordDrawer,
  setEditLandlordDrawer,
  setRemoveLandlordDrawer,
  resetLandlordList,
  resetLandlordDetail,
} = landlordSlice.actions;

export const selectLandlordDetail = (state) => state.landlord.landlordDetail;

export default landlordSlice.reducer;
