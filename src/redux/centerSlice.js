import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import apiClient from '@/api/axios';
import { extractErrorMessage } from '@/utils/error-utils';

const serializeError = (error) => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  return error?.message || 'Something went wrong while fetching centers';
};

const initialState = {
  centerListData: {
    data: [],
    isLoading: false,
    isLoadingMore: false,
    error: null,
    page: 1,
    pageSize: 20,
    hasMore: false,
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    totalCount: 0,
    statusCounts: {}, // Store status_counts from API
  },

  centerDetails: {
    data: [],
    isLoading: false,
    error: null,
    status: null,
  },

  columnPreferences: {
    data: [],
    isLoading: false,
    error: null,
  },

  centerAccess: {
    data: [],
    status: 'idle',
    error: null,
    selectedCenters: [],
  },

  filterDrawer: { isOpen: false },

  createCenterDrawer: {
    isOpen: false,
    isLoading: false,
    error: null,
    status: null,
  },

  viewCenterDrawer: {
    isOpen: false,
    selectedCenter: null,
  },

  addLandlordModal: { isOpen: false },
  addTeamMemberModal: { isOpen: false },
  createTeamMemberModal: { isOpen: false },

  editTeamMemberModal: {
    isOpen: false,
    selectedTeamMember: null,
  },

  addComplianceDocumentModal: {
    isOpen: false,
  },

  editComplianceDocumentModal: {
    isOpen: false,
    selectedDocument: null,
  },

  removeComplianceDocumentModal: {
    isOpen: false,
    selectedDocument: null,
  },

  complianceDocument: {
    isLoading: false,
    error: null,
    status: null,
  },

  documentTypes: {
    data: [],
    isLoading: false,
    error: null,
  },

  teamAssociated: {
    createAssociatedTeamMember: {
      isLoading: false,
      error: null,
    },
    roleList: {
      data: [],
      isLoading: false,
      error: null,
    },
    teamMemberList: {
      data: [],
      isLoading: false,
      error: null,
    },
  },
  viewCenterSpace: {
    spaces: {
      data: [],
      isLoading: true,
      error: null,
    },
  },
};

/* --------------------------- THUNKS --------------------------- */

export const createCenterThunk = createAsyncThunk(
  'center/createCenter',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/resource/Center', payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getCenterDetailsThunk = createAsyncThunk(
  'center/getCenterDetails',
  async (center_id, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(
        '/method/devx.center_management.doctype.center.center.get_center_details',
        {
          center_id,
        },
      );
      // New API returns data in response.data.message
      return response.data?.message || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const updateCenterThunk = createAsyncThunk(
  'center/updateCenter',
  async ({ center_id, payload }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/resource/Center/${center_id}`, payload);
      return response.data;
    } catch (error) {
      // const errorMessage =
      //   error.response?.data?.message ||
      //   error.response?.data?.exc ||
      //   (typeof error.response?.data === 'string'
      //     ? error.response.data
      //     : error.response?.data?.exception) ||
      //   error.message ||
      //   'Failed to update center';
      return rejectWithValue(
        error.serialized || extractErrorMessage(error) || 'Failed to update center',
      );
    }
  },
);

export const updateCenterFloorDetailsThunk = createAsyncThunk(
  'center/updateCenterFloorDetails',
  async ({ center_id, floor_details }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/resource/Center/${center_id}`, {
        floor_details,
      });
      return response.data;
    } catch (error) {
      // const errorMessage =
      //   error.response?.data?.message ||
      //   error.response?.data?.exc ||
      //   (typeof error.response?.data === 'string'
      //     ? error.response.data
      //     : error.response?.data?.exception) ||
      //   error.message ||
      //   'Failed to update floor details';
      return rejectWithValue(
        error.serialized || extractErrorMessage(error) || 'Failed to update floor details',
      );
    }
  },
);

export const getCenterListThunk = createAsyncThunk(
  'center/getCenterList',
  async (
    {
      keyword = '',
      filters = [],
      navbar_filter = null,
      page = 1,
      pageSize = 20,
      append = false,
      order_by = 'creation desc',
    } = {},
    { rejectWithValue },
  ) => {
    try {
      const formData = new FormData();
      formData.append('doctype', 'Center');

      // Add navbar_filter if provided
      if (navbar_filter && Array.isArray(navbar_filter) && navbar_filter.length > 0) {
        const navbarFilterValue = { name: navbar_filter };
        formData.append('navbar_filter', JSON.stringify(navbarFilterValue));
      }

      formData.append('limit_page_length', String(pageSize));
      formData.append('page', String(page));
      formData.append('order_by', order_by);

      // Always use list_with_search_filters API
      if (filters?.length > 0) {
        formData.append('filters', JSON.stringify(filters));
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

      // Extract pagination info from API response
      const apiPage = responseData.page ?? page;
      const apiPageSize = responseData.page_size ?? pageSize;
      const apiCount = responseData.count ?? results.length; // Number of results in current page

      // Calculate currentCount: total items loaded so far
      // Formula: (page - 1) * page_size + count
      // This gives us the cumulative count of items loaded across all pages
      const itemsLoadedSoFar = (apiPage - 1) * apiPageSize + apiCount;

      // Calculate currentCount for append operations
      let currentCount;
      if (append) {
        // For append, use API's current_count if available, otherwise calculate from items loaded
        currentCount = responseData.current_count ?? itemsLoadedSoFar;
      } else {
        // For initial load, currentCount is the items loaded in this page
        currentCount = itemsLoadedSoFar;
      }

      // Calculate hasMore: there's more data if items loaded so far < total_count
      // Also check if API provides has_more directly (most reliable)
      const hasMoreFromAPI = responseData.has_more;
      let hasMore;

      if (hasMoreFromAPI !== undefined) {
        // Use API's has_more if provided (most reliable)
        hasMore = hasMoreFromAPI;
      } else if (totalCount !== undefined && totalCount > 0) {
        // Calculate based on items loaded vs total count
        // If count < page_size, we're on the last page (no more data)
        // Otherwise, check if items loaded < total count
        hasMore = apiCount === apiPageSize && itemsLoadedSoFar < totalCount;
      } else {
        // Fallback: if we got a full page, assume there might be more
        hasMore = apiCount === apiPageSize;
      }

      const statusCounts = responseData.status_counts || {};

      return {
        results,
        page,
        pageSize,
        append,
        hasMore,
        totalCount,
        current_count: currentCount, // Pass current_count to reducer for append calculations
        statusCounts,
        message: responseData, // Preserve original message for backward compatibility
        status: response?.data?.status || response?.status || 200,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.exc ||
        typeof error.response?.data === 'string'
          ? error.response.data
          : error.response?.data?.exception || error.message;

      return rejectWithValue(errorMessage);
    }
  },
);

export const getCenterColumnPreferencesThunk = createAsyncThunk(
  'center/getCenterColumnPreferences',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/method/devx.api.listview.get_list_pref', {
        doctype: 'Center',
      });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.exc ||
        typeof error.response?.data === 'string'
          ? error.response.data
          : error.response?.data?.exception || error.message;

      return rejectWithValue(errorMessage);
    }
  },
);

export const saveCenterColumnPreferencesThunk = createAsyncThunk(
  'center/saveCenterColumnPreferences',
  async (columns, { rejectWithValue }) => {
    try {
      const payload = {
        doctype: 'Center',
        columns: columns.map((c) => ({
          id: c.id,
          visible: c.visible !== false,
        })),
      };

      const response = await apiClient.post('/method/devx.api.listview.save_list_pref', payload);
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.exc ||
        typeof error.response?.data === 'string'
          ? error.response.data
          : error.response?.data?.exception || error.message;

      return rejectWithValue(errorMessage);
    }
  },
);

export const fetchCenterAccess = createAsyncThunk(
  'center/fetchCenterAccess',
  async (_, thunkAPI) => {
    try {
      // New API: returns data grouped by zone
      // {
      //   "message": [
      //     {
      //       "zone": "Zone 1",
      //       "centers": [
      //         { "name": "CTR-01", "center_name": "The First" }
      //       ]
      //     }
      //   ]
      // }
      const response = await apiClient.get(
        '/method/devx.center_management.doctype.center.center.get_zones_and_centers',
      );

      const zones = response?.data?.message ?? [];

      // Normalize to a flat list of centers while preserving zone info
      const centers = zones.flatMap((zoneGroup) => {
        const zoneName = zoneGroup?.zone || 'Unassigned';
        const groupCenters = Array.isArray(zoneGroup?.centers) ? zoneGroup.centers : [];

        return groupCenters.map((center) => ({
          ...center,
          zone: center.zone || zoneName,
        }));
      });

      return centers;
    } catch (error) {
      return thunkAPI.rejectWithValue(serializeError(error));
    }
  },
);

export const fetchCenterDocumentTypesThunk = createAsyncThunk(
  'center/fetchCenterDocumentTypes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/resource/Center Document Types', {
        params: {
          fields: JSON.stringify(['name', 'has_expiry']),
          limit_page_length: 999,
        },
      });
      const types = Array.isArray(response.data?.data) ? response.data.data : [];
      return types;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const uploadBuildingDetailsThunk = createAsyncThunk(
  'center/uploadBuildingDetails',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(
        '/method/devx.center_management.doctype.center.center.update_building_details',
        payload,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getTeamAssociatedRoleListThunk = createAsyncThunk(
  'center/getTeamAssociatedRoleList',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/method/devx.api.user.get_roles_without_desk_access');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getAssociatedTeamMembersListThunk = createAsyncThunk(
  'center/getAssociatedTeamMembersList',
  async (payload, { rejectWithValue }) => {
    try {
      console.log('payload in getAssociatedTeamMembersListThunk', payload);
      const response = await apiClient.post(
        '/method/devx.center_management.doctype.center.center.get_associate_team_member',
        {
          role: payload,
        },
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const createAssociatedTeamMemberThunk = createAsyncThunk(
  'center/createAssociatedTeamMember',
  async (payload, { rejectWithValue }) => {
    try {
      // Check if payload is FormData
      const isFormData = payload instanceof FormData;

      const config = isFormData
        ? {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
        : {};

      const response = await apiClient.post(
        '/method/devx.center_management.doctype.center.center.create_associate_team_member',
        payload,
        config,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const updateAssociateTeamMemberThunk = createAsyncThunk(
  'center/updateAssociateTeamMember',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(
        '/method/devx.center_management.doctype.center.center.update_associate_team_role',
        payload,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const removeBuildingDetailsDocumentThunk = createAsyncThunk(
  'center/removeBuildingDetailsDocument',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(
        '/method/devx.center_management.doctype.center.center.delete_building_detail',
        payload,
      );
      console.log('response.data', response.data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getCenterSpaces = createAsyncThunk(
  'center/getCenterSpaces',
  async (centerId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/resource/Space', {
        params: {
          fields: JSON.stringify([
            'name',
            'floor',
            'inventory_type',
            'status',
            'no_of_seats',
            'expected_per_seat_cost',
            'center',
          ]),
          filters: JSON.stringify([['center', '=', centerId]]),
        },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const deleteCenterSpaceThunk = createAsyncThunk(
  'center/deleteCenterSpace',
  async (space_id, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/resource/Space/${space_id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const updateCenterSpaceThunk = createAsyncThunk(
  'center/updateCenterSpace',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/resource/Space/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

// export const getCenterSpaceDetails = createAsyncThunk(
//   'center/getCenterSpaceDetails',
//   async (spaces_ids, { rejectWithValue }) => {
//     try {
//       let data = [];
//       for (let i = 0; i < spaces_ids.length; i++) {
//         const response = await apiClient.get(`/resource/Space/${spaces_ids[i]}`);
//         data.push(response.data);
//       }
//       console.log('data', data);
//       return data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data || error.message);
//     }
//   },
// )

/* --------------------------- SLICE --------------------------- */

const centerSlice = createSlice({
  name: 'center',
  initialState,
  reducers: {
    setFilterDrawer: (state) => {
      state.filterDrawer.isOpen = !state.filterDrawer.isOpen;
    },

    setCreateCenterDrawer: (state, action) => {
      state.createCenterDrawer.isOpen =
        typeof action.payload === 'boolean' ? action.payload : !state.createCenterDrawer.isOpen;
    },

    setViewCenterDrawer: (state, action) => {
      if (typeof action.payload === 'boolean') {
        state.viewCenterDrawer.isOpen = action.payload;
        if (!action.payload) state.viewCenterDrawer.selectedCenter = null;
      } else if (action.payload?.center) {
        state.viewCenterDrawer.isOpen = true;
        state.viewCenterDrawer.selectedCenter = action.payload.center;
      } else {
        state.viewCenterDrawer.isOpen = !state.viewCenterDrawer.isOpen;
        if (!state.viewCenterDrawer.isOpen) state.viewCenterDrawer.selectedCenter = null;
      }
    },

    setAddLandlordModal: (state, action) => {
      state.addLandlordModal.isOpen =
        typeof action.payload === 'boolean' ? action.payload : !state.addLandlordModal.isOpen;
    },

    setAddTeamMemberModal: (state, action) => {
      state.addTeamMemberModal.isOpen =
        typeof action.payload === 'boolean' ? action.payload : !state.addTeamMemberModal.isOpen;
    },

    setCreateTeamMemberModal: (state, action) => {
      state.createTeamMemberModal.isOpen =
        typeof action.payload === 'boolean' ? action.payload : !state.createTeamMemberModal.isOpen;
    },

    setEditTeamMemberModal: (state, action) => {
      if (typeof action.payload === 'boolean') {
        state.editTeamMemberModal.isOpen = action.payload;
        if (!action.payload) state.editTeamMemberModal.selectedTeamMember = null;
      } else if (action.payload?.teamMember) {
        state.editTeamMemberModal.isOpen = true;
        state.editTeamMemberModal.selectedTeamMember = action.payload.teamMember;
      } else {
        state.editTeamMemberModal.isOpen = !state.editTeamMemberModal.isOpen;
        if (!state.editTeamMemberModal.isOpen) {
          state.editTeamMemberModal.selectedTeamMember = null;
        }
      }
    },

    setAddComplianceDocumentModal: (state, action) => {
      state.addComplianceDocumentModal.isOpen =
        typeof action.payload === 'boolean'
          ? action.payload
          : !state.addComplianceDocumentModal.isOpen;
    },

    setEditComplianceDocumentModal: (state, action) => {
      if (typeof action.payload === 'boolean') {
        state.editComplianceDocumentModal.isOpen = action.payload;
        if (!action.payload) state.editComplianceDocumentModal.selectedDocument = null;
      } else if (action.payload?.document) {
        state.editComplianceDocumentModal.isOpen = true;
        state.editComplianceDocumentModal.selectedDocument = action.payload.document;
      } else {
        state.editComplianceDocumentModal.isOpen = !state.editComplianceDocumentModal.isOpen;
        if (!state.editComplianceDocumentModal.isOpen)
          state.editComplianceDocumentModal.selectedDocument = null;
      }
    },

    setRemoveComplianceDocumentModal: (state, action) => {
      if (typeof action.payload === 'boolean') {
        state.removeComplianceDocumentModal.isOpen = action.payload;
        if (!action.payload) state.removeComplianceDocumentModal.selectedDocument = null;
      } else if (action.payload?.document) {
        state.removeComplianceDocumentModal.isOpen = true;
        state.removeComplianceDocumentModal.selectedDocument = action.payload.document;
      } else {
        state.removeComplianceDocumentModal.isOpen = !state.removeComplianceDocumentModal.isOpen;
        if (!state.removeComplianceDocumentModal.isOpen)
          state.removeComplianceDocumentModal.selectedDocument = null;
      }
    },

    /* merged from main branch */
    setSelectedCenters: (state, action) => {
      const selection = Array.isArray(action.payload) ? action.payload : [];
      state.centerAccess.selectedCenters = [...new Set(selection)];
    },
  },

  extraReducers: (builder) => {
    /* createCenter */
    builder
      .addCase(createCenterThunk.pending, (state) => {
        state.createCenterDrawer.isLoading = true;
        state.createCenterDrawer.error = null;
        state.createCenterDrawer.status = null;
      })
      .addCase(createCenterThunk.fulfilled, (state, action) => {
        state.createCenterDrawer.isLoading = false;
        state.createCenterDrawer.status = action.payload?.status || 'success';
      })
      .addCase(createCenterThunk.rejected, (state, action) => {
        state.createCenterDrawer.isLoading = false;
        state.createCenterDrawer.error = action.payload;
      });

    /* Center List */
    builder
      .addCase(getCenterListThunk.pending, (state, action) => {
        const isAppend = Boolean(action.meta?.arg?.append);
        state.centerListData.status = 'loading';
        state.centerListData.error = null;
        if (isAppend) {
          state.centerListData.isLoadingMore = true;
        } else {
          state.centerListData.isLoading = true;
        }
      })
      .addCase(getCenterListThunk.fulfilled, (state, { payload }) => {
        state.centerListData.isLoading = false;
        state.centerListData.isLoadingMore = false;
        state.centerListData.status = 'succeeded';
        state.centerListData.error = null;

        const {
          results,
          page,
          pageSize,
          append,
          hasMore,
          totalCount,
          current_count,
          statusCounts,
        } = payload;

        // Update pagination state
        if (page !== undefined) {
          state.centerListData.page = page;
        }
        if (pageSize !== undefined) {
          state.centerListData.pageSize = pageSize;
        }
        // Update hasMore - for non-append operations, use the hasMore from payload
        // For append operations, hasMore is recalculated above based on actual data
        if (!append && hasMore !== undefined) {
          state.centerListData.hasMore = hasMore;
        } else if (!append) {
          // Fallback: calculate hasMore if not provided
          const dataLength = Array.isArray(results) ? results.length : 0;
          state.centerListData.hasMore = dataLength === pageSize && dataLength < totalCount;
        }
        if (totalCount !== undefined) {
          state.centerListData.totalCount = totalCount;
        }
        // Only update statusCounts if it's provided (not on append operations)
        if (statusCounts && Object.keys(statusCounts).length > 0 && !append) {
          state.centerListData.statusCounts = statusCounts;
        }

        // Handle append logic for scroll pagination
        if (append && Array.isArray(results)) {
          // Append new results to existing results, avoiding duplicates
          const existingData = state.centerListData.data || [];
          const existingIds = new Set(existingData.map((item) => item.name || item.id));
          const newResults = results.filter((item) => !existingIds.has(item.name || item.id));
          state.centerListData.data = [...existingData, ...newResults];

          // Recalculate hasMore based on current_count from API response
          // This is the most accurate way as it uses the API's calculation
          if (current_count !== undefined && totalCount !== undefined) {
            // Use API's current_count if provided (calculated as: (page - 1) * page_size + count)
            state.centerListData.hasMore = current_count < totalCount;
          } else if (hasMore !== undefined) {
            // Fallback to hasMore from payload if current_count not available
            state.centerListData.hasMore = hasMore;
          } else {
            // Final fallback: calculate from data length
            const calculatedCurrentCount = state.centerListData.data.length;
            state.centerListData.hasMore = calculatedCurrentCount < totalCount;
          }
        } else {
          // Replace data for new search/filter
          if (Array.isArray(results)) {
            state.centerListData.data = results;
          } else if (Array.isArray(payload)) {
            state.centerListData.data = payload;
          } else if (payload?.message?.results) {
            state.centerListData.data = payload.message.results;
          } else if (Array.isArray(payload?.message)) {
            state.centerListData.data = payload.message;
          } else if (Array.isArray(payload?.data)) {
            state.centerListData.data = payload.data;
          } else {
            state.centerListData.data = [];
          }
        }
      })
      .addCase(getCenterListThunk.rejected, (state, action) => {
        state.centerListData.isLoading = false;
        state.centerListData.isLoadingMore = false;
        state.centerListData.status = 'failed';
        state.centerListData.error = action.payload;
      });

    /* Column Pref */
    builder
      .addCase(getCenterColumnPreferencesThunk.pending, (state) => {
        state.columnPreferences.isLoading = true;
      })
      .addCase(getCenterColumnPreferencesThunk.fulfilled, (state, { payload }) => {
        state.columnPreferences.isLoading = false;
        if (Array.isArray(payload)) {
          state.columnPreferences.data = payload;
        } else if (Array.isArray(payload?.message)) {
          state.columnPreferences.data = payload.message;
        } else if (Array.isArray(payload?.data)) {
          state.columnPreferences.data = payload.data;
        } else {
          state.columnPreferences.data = [];
        }
      })
      .addCase(getCenterColumnPreferencesThunk.rejected, (state, action) => {
        state.columnPreferences.isLoading = false;
        state.columnPreferences.error = action.payload;
      });

    /* Center Details */
    builder
      .addCase(getCenterDetailsThunk.pending, (state) => {
        state.centerDetails.isLoading = true;
      })
      .addCase(getCenterDetailsThunk.fulfilled, (state, action) => {
        state.centerDetails.isLoading = false;
        // New API returns center details directly in action.payload (which is response.data.message)
        state.centerDetails.data = action.payload;
      })
      .addCase(getCenterDetailsThunk.rejected, (state, action) => {
        state.centerDetails.isLoading = false;
        state.centerDetails.error = action.payload;
      });

    /* Center Access */
    builder
      .addCase(fetchCenterAccess.pending, (state, action) => {
        const silent = action.meta?.arg?.silent || false;
        if (!silent) {
          state.centerAccess.status = 'loading';
        }
      })
      .addCase(fetchCenterAccess.fulfilled, (state, action) => {
        try {
          const silent = action.meta?.arg?.silent || false;
          const centers = action.payload;
          if (!silent) {
            state.centerAccess.status = 'succeeded';
          }
          const allSelected =
            state.centerAccess.selectedCenters.length === state.centerAccess.data.length;
          state.centerAccess.data = centers || [];

          if (state.centerAccess.selectedCenters.length === 0 || allSelected) {
            const all = (centers || []).map((c) => c?.name).filter(Boolean);
            state.centerAccess.selectedCenters = [...new Set(all)];
          }
        } catch (error) {
          console.error(error);
        }
      })
      .addCase(fetchCenterAccess.rejected, (state, action) => {
        const silent = action.meta?.arg?.silent || false;
        if (!silent) {
          state.centerAccess.status = 'failed';
          state.centerAccess.error = action.payload;
        }
      });

    /* Document Types */
    builder
      .addCase(fetchCenterDocumentTypesThunk.pending, (state) => {
        state.documentTypes.isLoading = true;
        state.documentTypes.error = null;
      })
      .addCase(fetchCenterDocumentTypesThunk.fulfilled, (state, action) => {
        state.documentTypes.isLoading = false;
        state.documentTypes.data = action.payload || [];
        state.documentTypes.error = null;
      })
      .addCase(fetchCenterDocumentTypesThunk.rejected, (state, action) => {
        state.documentTypes.isLoading = false;
        state.documentTypes.error = action.payload;
        state.documentTypes.data = [];
      });

    /* Add Compliance Document */
    builder
      .addCase(uploadBuildingDetailsThunk.pending, (state) => {
        state.complianceDocument.isLoading = true;
      })
      .addCase(uploadBuildingDetailsThunk.fulfilled, (state, action) => {
        state.complianceDocument.isLoading = false;
        state.complianceDocument.status = action.payload?.status || 'success';
      })
      .addCase(uploadBuildingDetailsThunk.rejected, (state, action) => {
        state.complianceDocument.isLoading = false;
        state.complianceDocument.error = action.payload;
      });

    /* Team Associated */
    builder
      .addCase(getTeamAssociatedRoleListThunk.pending, (state) => {
        state.teamAssociated.roleList.isLoading = true;
      })
      .addCase(getTeamAssociatedRoleListThunk.fulfilled, (state, action) => {
        console.log('action in fulfilled of getTeamAssociatedRoleListThunk', action.payload);
        state.teamAssociated.roleList.isLoading = false;
        state.teamAssociated.roleList.data = action.payload;
      })
      .addCase(getTeamAssociatedRoleListThunk.rejected, (state, action) => {
        state.teamAssociated.roleList.isLoading = false;
        state.teamAssociated.roleList.error = action.payload;
      });

    /* Associated Team Members */
    builder
      .addCase(getAssociatedTeamMembersListThunk.pending, (state) => {
        state.teamAssociated.teamMemberList.isLoading = true;
      })
      .addCase(getAssociatedTeamMembersListThunk.fulfilled, (state, action) => {
        // console.log('action in fulfilled of getAssociatedTeamMembersListThunk', action.payload);
        state.teamAssociated.teamMemberList.isLoading = false;
        state.teamAssociated.teamMemberList.data = action.payload?.message || action.payload;
      })
      .addCase(getAssociatedTeamMembersListThunk.rejected, (state, action) => {
        state.teamAssociated.teamMemberList.isLoading = false;
        state.teamAssociated.teamMemberList.error = action.payload;
      });

    /* Create Associated Team Member */
    builder
      .addCase(createAssociatedTeamMemberThunk.pending, (state) => {
        state.teamAssociated.createAssociatedTeamMember.isLoading = true;
      })
      .addCase(createAssociatedTeamMemberThunk.fulfilled, (state, action) => {
        console.log('action in fulfilled of createAssociatedTeamMemberThunk', action.payload);
        state.teamAssociated.createAssociatedTeamMember.isLoading = false;
      })
      .addCase(createAssociatedTeamMemberThunk.rejected, (state, action) => {
        state.teamAssociated.createAssociatedTeamMember.isLoading = false;
        state.teamAssociated.createAssociatedTeamMember.error = action.payload;
      });

    builder
      .addCase(getCenterSpaces.pending, (state) => {
        state.viewCenterSpace.spaces.isLoading = true;
      })
      .addCase(getCenterSpaces.fulfilled, (state, action) => {
        state.viewCenterSpace.spaces.isLoading = false;
        state.viewCenterSpace.spaces.data = action.payload;
      })
      .addCase(getCenterSpaces.rejected, (state, action) => {
        state.viewCenterSpace.spaces.isLoading = false;
        state.viewCenterSpace.spaces.error = action.payload;
      });
  },
});

export const {
  setFilterDrawer,
  setCreateCenterDrawer,
  setViewCenterDrawer,
  setAddLandlordModal,
  setAddTeamMemberModal,
  setCreateTeamMemberModal,
  setEditTeamMemberModal,
  setAddComplianceDocumentModal,
  setEditComplianceDocumentModal,
  setRemoveComplianceDocumentModal,
  setSelectedCenters,
} = centerSlice.actions;

export default centerSlice.reducer;

export const selectCenterAccess = (state) =>
  state.center?.centerAccess || initialState.centerAccess;
