import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import apiClient from '@/api/axios';

const CLIENT_DOCTYPE = 'Customer';

const initialState = {
  clientListData: {
    data: [],
    isLoading: false,
    isLoadingMore: false,
    error: null,
    totalCount: 0,
    statusCounts: {}, // Store status_counts from API
    currentPage: 1,
    pageSize: 10,
    hasMore: true,
    sorting: [], // Array of { id: string, desc: boolean }
  },
  createClientModal: {
    isOpen: false,
    isLoading: false,
    error: null,
    status: null,
    newClient: null,
  },
  editClientModal: {
    isOpen: false,
    selectedClient: null,
  },
  removeClientModal: {
    isOpen: false,
    selectedClient: null,
    isLoading: false,
    error: null,
  },
  clientColumnList: null,
};

export const createClientThunk = createAsyncThunk(
  'client/createClient',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/resource/Customer', payload, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      // Use pre-serialized error from axios interceptor, or serialize if not from axios
      return rejectWithValue(error.serialized || error);
    }
  },
);

export const getClientListThunk = createAsyncThunk(
  'client/getClientList',
  async (
    {
      search = '',
      filters = [],
      page = 1,
      pageSize = 10,
      orderBy = 'creation desc',
      append = false,
      navbarFilter = null,
      // Kept for fulfilled payload so reducer/store knows what was requested
      status,
      center,
      state,
      city,
    } = {},
    { rejectWithValue },
  ) => {
    try {
      const keyword = search && search.trim() ? search.trim() : '';
      const rawFilters =
        Array.isArray(filters) && filters.length > 0 ? JSON.stringify(filters) : '';

      // Prepare FormData as shown in the API example
      // Note: The example shows GET with FormData, but axios GET doesn't support body data
      // Using POST with FormData which is the standard approach
      const formData = new FormData();
      formData.append('page', String(page));
      formData.append('limit_page_length', String(pageSize));
      formData.append('order_by', orderBy || '');
      formData.append('filters', rawFilters);
      // Build nav_filter (for navigation/filtering) from navbarFilter (selected centers)
      if (navbarFilter && Array.isArray(navbarFilter) && navbarFilter.length > 0) {
        const navFilterValue = { name: navbarFilter };
        formData.append('nav_filter', JSON.stringify(navFilterValue));
      }
      if (keyword) {
        formData.append('keyword', keyword);
      }

      // Use POST method with FormData (standard approach for FormData)
      // If the API specifically requires GET, we may need to adjust the backend or use a custom axios config
      // Note: axios interceptor automatically handles FormData headers
      const response = await apiClient.post(
        '/method/devx.overrides.client.client_list_view',
        formData,
      );

      const responseData = response?.data || {};
      const apiResponse = responseData.message || {};

      // Extract results from API response
      const rawResults = apiResponse.results || [];

      // Transform API response to match frontend expected format
      const transformedData = rawResults.map((item) => ({
        // Map customer_id to name (ID field)
        name: item.customer_id || '',
        // Map client_name to both customer_name and custom_display_name
        customer_name: item.client_name || '',
        custom_display_name: item.client_name || '',
        // Map center_names array to custom_center
        // Preserve as array for better handling in UI (can be converted to string if needed)
        custom_center:
          Array.isArray(item.center_names) && item.center_names.length > 0
            ? item.center_names
            : null,
        // Map average_csi to custom_avg_csi_score
        custom_avg_csi_score: item.average_csi != null ? item.average_csi : '-',
        // Map spoc_name to custom_spoc_name
        custom_spoc_name: item.spoc_name || '-',
        // Map spoc_contact to custom_spoc_contact_num
        custom_spoc_contact_num: item.spoc_contact || '-',
        // Map engagement (keep as is, but table shows '-', so we'll store it)
        engagement: item.engagement || '-',
        // Map custom_status
        custom_status: item.custom_status || '-',
        // These fields are not in the API response, so set defaults
        owner: '-', // Created By - not available in API response
        creation: '-', // Created At - not available in API response
      }));

      // Extract pagination info from API response
      const totalCount = apiResponse.total_count || 0;
      const currentPage = apiResponse.page || page;
      const responsePageSize = apiResponse.page_size || pageSize;
      const totalPages = apiResponse.total_pages || 1;
      const hasMore = currentPage < totalPages;
      const statusCounts = apiResponse.status_counts || {};

      return {
        data: transformedData,
        totalCount,
        statusCounts,
        currentPage,
        pageSize: responsePageSize,
        hasMore,
        append,
        filters: {
          search,
          status: status ?? '',
          center: center ?? '',
          state: state ?? '',
          city: city ?? '',
          navbarFilter,
        },
      };
    } catch (error) {
      console.log('error', error);
      // Use pre-serialized error from axios interceptor, or serialize if not from axios
      return rejectWithValue(error.serialized || error);
    }
  },
);

export const updateClientThunk = createAsyncThunk(
  'client/updateClient',
  async ({ clientId, payload }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/resource/Customer/${clientId}`, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.serialized || error);
    }
  },
);

export const deleteClientThunk = createAsyncThunk(
  'client/deleteClient',
  async ({ clientId }, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/resource/Client/${clientId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.serialized || error);
    }
  },
);

export const updateClientColumnList = createAsyncThunk(
  'client/updateClientColumnList',
  async (body, thunkAPI) => {
    try {
      const response = await apiClient.post('/method/devx.api.listview.save_list_pref', {
        doctype: CLIENT_DOCTYPE,
        columns: body,
      });
      console.log('response', response?.data?.message);
      return response?.data?.message;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.serialized || error);
    }
  },
);

export const fetchClientColumnList = createAsyncThunk(
  'client/fetchClientColumnList',
  async (_, thunkAPI) => {
    try {
      const response = await apiClient.get('/method/devx.api.listview.get_list_pref', {
        params: {
          doctype: CLIENT_DOCTYPE,
        },
      });
      return response?.data?.message;
    } catch (error) {
      console.log('fetch error', error);
      return thunkAPI.rejectWithValue(error.serialized || error);
    }
  },
);

const clientSlice = createSlice({
  name: 'client',
  initialState,
  reducers: {
    resetClientList: (state) => {
      state.clientListData.data = [];
      state.clientListData.currentPage = 1;
      state.clientListData.totalCount = 0;
      state.clientListData.hasMore = true;
      state.clientListData.error = null;
    },
    setClientSorting: (state, action) => {
      state.clientListData.sorting = action.payload;
    },
    setCreateClientModal: (state, action) => {
      state.createClientModal.isOpen =
        typeof action.payload === 'boolean' ? action.payload : !state.createClientModal.isOpen;
      if (!state.createClientModal.isOpen) {
        state.createClientModal.newClient = null;
        state.createClientModal.error = null;
        state.createClientModal.status = null;
      }
    },
    setEditClientModal: (state, action) => {
      if (typeof action.payload === 'boolean') {
        state.editClientModal.isOpen = action.payload;
        if (!action.payload) {
          state.editClientModal.selectedClient = null;
        }
      } else if (action.payload?.client) {
        state.editClientModal.isOpen = true;
        state.editClientModal.selectedClient = action.payload.client;
      } else {
        state.editClientModal.isOpen = !state.editClientModal.isOpen;
        if (!state.editClientModal.isOpen) {
          state.editClientModal.selectedClient = null;
        }
      }
    },
    setRemoveClientModal: (state, action) => {
      if (typeof action.payload === 'boolean') {
        state.removeClientModal.isOpen = action.payload;
        if (!action.payload) {
          state.removeClientModal.selectedClient = null;
        }
      } else if (action.payload?.client) {
        state.removeClientModal.isOpen = true;
        state.removeClientModal.selectedClient = action.payload.client;
      } else {
        state.removeClientModal.isOpen = !state.removeClientModal.isOpen;
        if (!state.removeClientModal.isOpen) {
          state.removeClientModal.selectedClient = null;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getClientListThunk.pending, (state, action) => {
        const isAppend = Boolean(action.meta?.arg?.append);
        state.clientListData.error = null;
        if (isAppend) {
          state.clientListData.isLoadingMore = true;
        } else {
          state.clientListData.isLoading = true;
        }
      })
      .addCase(getClientListThunk.fulfilled, (state, { payload }) => {
        state.clientListData.isLoading = false;
        state.clientListData.isLoadingMore = false;
        state.clientListData.error = null;

        if (payload?.data) {
          // If append is true, append new data to existing data
          if (payload.append && Array.isArray(state.clientListData.data)) {
            state.clientListData.data = [...state.clientListData.data, ...payload.data];
          } else {
            state.clientListData.data = payload.data;
          }
          state.clientListData.totalCount = payload.totalCount || 0;
          state.clientListData.currentPage = payload.currentPage || 1;
          state.clientListData.pageSize = payload.pageSize || 10;
          state.clientListData.hasMore = payload.hasMore || false;
          // Only update statusCounts if it's provided (not on append operations)
          if (
            payload.statusCounts &&
            Object.keys(payload.statusCounts).length > 0 &&
            !payload.append
          ) {
            state.clientListData.statusCounts = payload.statusCounts;
          }
        } else {
          if (!payload?.append) {
            state.clientListData.data = [];
            state.clientListData.totalCount = 0;
          }
        }
      })
      .addCase(getClientListThunk.rejected, (state, action) => {
        state.clientListData.isLoading = false;
        state.clientListData.isLoadingMore = false;
        state.clientListData.error = action.payload;
      });

    builder
      .addCase(createClientThunk.pending, (state) => {
        state.createClientModal.isLoading = true;
        state.createClientModal.error = null;
        state.createClientModal.status = null;
      })
      .addCase(createClientThunk.fulfilled, (state, { payload }) => {
        state.createClientModal.isLoading = false;
        state.createClientModal.newClient = payload;
        state.createClientModal.status = payload?.status || 'success';
      })
      .addCase(createClientThunk.rejected, (state, action) => {
        state.createClientModal.isLoading = false;
        state.createClientModal.error = action.payload;
      });

    builder
      .addCase(updateClientThunk.pending, (state) => {
        state.clientListData.isLoading = true;
        state.clientListData.error = null;
      })
      .addCase(updateClientThunk.fulfilled, (state, action) => {
        state.clientListData.isLoading = false;
        if (action.payload?.data) {
          state.clientListData.data = action.payload.data;
        }
      })
      .addCase(updateClientThunk.rejected, (state, action) => {
        state.clientListData.isLoading = false;
        state.clientListData.error = action.payload;
      });

    builder
      .addCase(deleteClientThunk.pending, (state) => {
        state.removeClientModal.isLoading = true;
        state.removeClientModal.error = null;
      })
      .addCase(deleteClientThunk.fulfilled, (state) => {
        state.removeClientModal.isLoading = false;
        state.removeClientModal.error = null;
      })
      .addCase(deleteClientThunk.rejected, (state, action) => {
        state.removeClientModal.isLoading = false;
        state.removeClientModal.error = action.payload;
      })
      .addCase(fetchClientColumnList.pending, (state) => {
        state.clientColumnList = null;
      })
      .addCase(fetchClientColumnList.fulfilled, (state, action) => {
        state.clientColumnList = action.payload;
      })
      .addCase(fetchClientColumnList.rejected, (state, action) => {
        state.clientColumnList = null;
      })
      .addCase(updateClientColumnList.fulfilled, (state, action) => {})
      .addCase(updateClientColumnList.rejected, (state, action) => {
        state.clientColumnList = null;
      });
  },
});

export const {
  resetClientList,
  setClientSorting,
  setCreateClientModal,
  setEditClientModal,
  setRemoveClientModal,
} = clientSlice.actions;

// Selectors
export const selectClientListData = (state) =>
  state.client?.clientListData || initialState.clientListData;

export default clientSlice.reducer;
