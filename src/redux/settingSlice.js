import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import apiClient from '@/api/axios';

const initialState = {
  clientOnboarding: {
    getList: {
      data: [],
      isLoading: false,
      error: null,
      status: null,
    },
    createTask: {
      isLoading: false,
      error: null,
      status: null,
    },
    getTaskDetail: {
      data: null,
      isLoading: false,
      error: null,
      status: null,
    },

    columnPreferences: {
      data: [],
      isLoading: false,
      error: null,
    },
  },
  clientExit: {
    getList: {
      data: [],
      isLoading: false,
      error: null,
      status: null,
    },
    createTask: {
      isLoading: false,
      error: null,
      status: null,
    },
    getTaskDetail: {
      data: null,
      isLoading: false,
      error: null,
      status: null,
    },
    columnPreferences: {
      data: [],
      isLoading: false,
      error: null,
    },
  },
  clientEngagement: {
    getList: {
      data: [],
      isLoading: false,
      error: null,
      status: null,
    },
    createTask: {
      isLoading: false,
      error: null,
      status: null,
    },
    getTaskDetail: {
      data: null,
      isLoading: false,
      error: null,
      status: null,
    },
    columnPreferences: {
      data: [],
      isLoading: false,
      error: null,
    },
  },

  clientTaskTags: {
    data: [],
    isLoading: false,
  },
};

export const createClientOnboardingTask = createAsyncThunk(
  'setting/createClientOnboardingTask',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(
        '/method/devx.api.settings.create_crm_task_master',
        payload,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

export const updateClientOnboardingTask = createAsyncThunk(
  'setting/updateClientOnboardingTask',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(
        '/method/devx.api.settings.update_crm_task_master',
        payload,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || 'Failed to update task');
    }
  },
);

export const getClientOnboardingTaskList = createAsyncThunk(
  'setting/getClientOnboardingTaskList',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(
        '/method/devx.api.settings.get_task_master_list_view',
        payload,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

export const getClientExitTaskList = createAsyncThunk(
  'setting/getClientExitTaskList',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(
        '/method/devx.api.settings.get_task_master_list_view',
        payload,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

export const getClientEngagementTaskList = createAsyncThunk(
  'setting/getClientEngagementTaskList',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(
        '/method/devx.api.settings.get_task_master_list_view',
        payload,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

export const getParticularTaskDetail = createAsyncThunk(
  'setting/getParticularTaskDetail',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(
        '/method/devx.api.settings.get_crm_task_master_detailed_view',
        payload,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

export const getClientOnboardingColumnPreferences = createAsyncThunk(
  'setting/getClientOnboardingColumnPreferences',
  async ({ react_table_id } = {}, { rejectWithValue }) => {
    try {
      const params = {
        doctype: 'CRM Task',
      };
      if (react_table_id) {
        params.react_table_id = react_table_id;
      }
      const response = await apiClient.get('/method/devx.api.listview.get_list_pref', {
        params,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

export const saveClientOnboardingColumnPreferences = createAsyncThunk(
  'setting/saveClientOnboardingColumnPreferences',
  async ({ columns, react_table_id }, { rejectWithValue }) => {
    try {
      const payload = {
        doctype: 'CRM Task',
        columns,
      };
      if (react_table_id) {
        payload.react_table_id = react_table_id;
      }

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

export const getClientExitColumnPreferences = createAsyncThunk(
  'setting/getClientExitColumnPreferences',
  async ({ react_table_id } = {}, { rejectWithValue }) => {
    try {
      const params = {
        doctype: 'CRM Task',
      };
      if (react_table_id) {
        params.react_table_id = react_table_id;
      }
      const response = await apiClient.get('/method/devx.api.listview.get_list_pref', {
        params,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

export const saveClientExitColumnPreferences = createAsyncThunk(
  'setting/saveClientExitColumnPreferences',
  async ({ columns, react_table_id }, { rejectWithValue }) => {
    try {
      const payload = {
        doctype: 'CRM Task',
        columns,
      };
      if (react_table_id) {
        payload.react_table_id = react_table_id;
      }

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

export const getClientEngagementColumnPreferences = createAsyncThunk(
  'setting/getClientEngagementColumnPreferences',
  async ({ react_table_id } = {}, { rejectWithValue }) => {
    try {
      const params = {
        doctype: 'CRM Task',
      };
      if (react_table_id) {
        params.react_table_id = react_table_id;
      }
      const response = await apiClient.get('/method/devx.api.listview.get_list_pref', {
        params,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

export const saveClientEngagementColumnPreferences = createAsyncThunk(
  'setting/saveClientEngagementColumnPreferences',
  async ({ columns, react_table_id }, { rejectWithValue }) => {
    try {
      const payload = {
        doctype: 'CRM Task',
        columns,
      };
      if (react_table_id) {
        payload.react_table_id = react_table_id;
      }

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

export const createClientTaskTags = createAsyncThunk(
  'setting/createClientTaskTags',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(
        '/method/devx.client_management.doctype.crm_task.crm_task.add_tag_to_crm_task',
        payload,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

export const fetchClientTaskTags = createAsyncThunk(
  'setting/fetchClientTaskTags',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(
        '/method/devx.client_management.doctype.crm_task.crm_task.get_tags',
        payload,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

export const addCrmTaskAttachment = createAsyncThunk(
  'setting/addCrmTaskAttachment',
  async (payload, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('task_id', payload.task_id);
      formData.append('attachment_file', payload.attachment_file);

      const response = await apiClient.post(
        '/method/devx.api.settings.add_crm_task_attachment',
        formData,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || 'Failed to add attachment');
    }
  },
);

export const removeCrmTaskAttachment = createAsyncThunk(
  'setting/removeCrmTaskAttachment',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/method/devx.api.core.delete_attachment', {
        child_row_id: payload.child_row_id,
        child_doctype: payload.child_doctype,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || error.message || 'Failed to remove attachment',
      );
    }
  },
);

export const updateClientTaskTags = createAsyncThunk(
  'setting/updateClientTaskTags',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(
        '/method/devx.client_management.doctype.crm_task.crm_task.update_crm_task_tags',
        payload,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || 'Failed to update task tags');
    }
  },
);

const settingSlice = createSlice({
  name: 'setting',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // createClientOnboardingTask reducers
    builder.addCase(createClientOnboardingTask.pending, (state) => {
      state.clientOnboarding.createTask.isLoading = true;
      state.clientOnboarding.createTask.error = null;
      state.clientOnboarding.createTask.status = null;
    });

    builder.addCase(createClientOnboardingTask.fulfilled, (state, action) => {
      state.clientOnboarding.createTask.isLoading = false;
      state.clientOnboarding.createTask.status = action.payload?.status || 200;
      state.clientOnboarding.createTask.error = null;
    });

    builder.addCase(createClientOnboardingTask.rejected, (state, action) => {
      state.clientOnboarding.createTask.isLoading = false;
      state.clientOnboarding.createTask.error = action.payload;
      state.clientOnboarding.createTask.status = action.payload?.status || 500;
    });

    // updateClientOnboardingTask reducers
    builder.addCase(updateClientOnboardingTask.pending, (state) => {
      state.clientOnboarding.createTask.isLoading = true;
      state.clientOnboarding.createTask.error = null;
      state.clientOnboarding.createTask.status = null;
    });

    builder.addCase(updateClientOnboardingTask.fulfilled, (state, action) => {
      state.clientOnboarding.createTask.isLoading = false;
      state.clientOnboarding.createTask.status = action.payload?.status || 200;
      state.clientOnboarding.createTask.error = null;
    });

    builder.addCase(updateClientOnboardingTask.rejected, (state, action) => {
      state.clientOnboarding.createTask.isLoading = false;
      state.clientOnboarding.createTask.error = action.payload;
      state.clientOnboarding.createTask.status = action.payload?.status || 500;
    });

    // getClientOnboardingTaskList reducers
    builder.addCase(getClientOnboardingTaskList.pending, (state) => {
      state.clientOnboarding.getList.isLoading = true;
      state.clientOnboarding.getList.error = null;
      state.clientOnboarding.getList.status = null;
    });

    builder.addCase(getClientOnboardingTaskList.fulfilled, (state, action) => {
      state.clientOnboarding.getList.isLoading = false;
      const responseData = action.payload?.message || action.payload?.data || action.payload;
      state.clientOnboarding.getList.data = responseData;
      state.clientOnboarding.getList.status = action.payload?.status || 200;
      state.clientOnboarding.getList.error = null;

      // Extract columns from response if available
      if (responseData?.columns && Array.isArray(responseData.columns)) {
        state.clientOnboarding.columnPreferences.data = responseData.columns;
        state.clientOnboarding.columnPreferences.error = null;
      }
    });

    builder.addCase(getClientOnboardingTaskList.rejected, (state, action) => {
      state.clientOnboarding.getList.isLoading = false;
      state.clientOnboarding.getList.error = action.payload;
      state.clientOnboarding.getList.status = action.payload?.status || 500;
    });

    // getParticularTaskDetail reducers
    builder.addCase(getParticularTaskDetail.pending, (state, action) => {
      const taskType = action.meta.arg?.type;
      if (taskType === 'Client Exiting') {
        state.clientExit.getTaskDetail.isLoading = true;
        state.clientExit.getTaskDetail.error = null;
        state.clientExit.getTaskDetail.status = null;
      } else if (taskType === 'Client Engagement') {
        state.clientEngagement.getTaskDetail.isLoading = true;
        state.clientEngagement.getTaskDetail.error = null;
        state.clientEngagement.getTaskDetail.status = null;
      } else {
        state.clientOnboarding.getTaskDetail.isLoading = true;
        state.clientOnboarding.getTaskDetail.error = null;
        state.clientOnboarding.getTaskDetail.status = null;
      }
    });

    builder.addCase(getParticularTaskDetail.fulfilled, (state, action) => {
      const taskType = action.meta.arg?.type;
      const taskData = action.payload?.message?.data || action.payload?.data || action.payload;
      if (taskType === 'Client Exiting') {
        state.clientExit.getTaskDetail.isLoading = false;
        state.clientExit.getTaskDetail.data = taskData;
        state.clientExit.getTaskDetail.status = action.payload?.status || 200;
        state.clientExit.getTaskDetail.error = null;
      } else if (taskType === 'Client Engagement') {
        state.clientEngagement.getTaskDetail.isLoading = false;
        state.clientEngagement.getTaskDetail.data = taskData;
        state.clientEngagement.getTaskDetail.status = action.payload?.status || 200;
        state.clientEngagement.getTaskDetail.error = null;
      } else {
        state.clientOnboarding.getTaskDetail.isLoading = false;
        state.clientOnboarding.getTaskDetail.data = taskData;
        state.clientOnboarding.getTaskDetail.status = action.payload?.status || 200;
        state.clientOnboarding.getTaskDetail.error = null;
      }
    });

    builder.addCase(getParticularTaskDetail.rejected, (state, action) => {
      const taskType = action.meta.arg?.type;
      if (taskType === 'Client Exiting') {
        state.clientExit.getTaskDetail.isLoading = false;
        state.clientExit.getTaskDetail.error = action.payload;
        state.clientExit.getTaskDetail.status = action.payload?.status || 500;
      } else if (taskType === 'Client Engagement') {
        state.clientEngagement.getTaskDetail.isLoading = false;
        state.clientEngagement.getTaskDetail.error = action.payload;
        state.clientEngagement.getTaskDetail.status = action.payload?.status || 500;
      } else {
        state.clientOnboarding.getTaskDetail.isLoading = false;
        state.clientOnboarding.getTaskDetail.error = action.payload;
        state.clientOnboarding.getTaskDetail.status = action.payload?.status || 500;
      }
    });

    // getClientExitTaskList reducers
    builder.addCase(getClientExitTaskList.pending, (state) => {
      state.clientExit.getList.isLoading = true;
      state.clientExit.getList.error = null;
      state.clientExit.getList.status = null;
    });

    builder.addCase(getClientExitTaskList.fulfilled, (state, action) => {
      state.clientExit.getList.isLoading = false;
      const responseData = action.payload?.message || action.payload?.data || action.payload;
      state.clientExit.getList.data = responseData;
      state.clientExit.getList.status = action.payload?.status || 200;
      state.clientExit.getList.error = null;

      // Extract columns from response if available
      if (responseData?.columns && Array.isArray(responseData.columns)) {
        state.clientExit.columnPreferences.data = responseData.columns;
        state.clientExit.columnPreferences.error = null;
      }
    });

    builder.addCase(getClientExitTaskList.rejected, (state, action) => {
      state.clientExit.getList.isLoading = false;
      state.clientExit.getList.error = action.payload;
      state.clientExit.getList.status = action.payload?.status || 500;
    });

    // getClientEngagementTaskList reducers
    builder.addCase(getClientEngagementTaskList.pending, (state) => {
      state.clientEngagement.getList.isLoading = true;
      state.clientEngagement.getList.error = null;
      state.clientEngagement.getList.status = null;
    });

    builder.addCase(getClientEngagementTaskList.fulfilled, (state, action) => {
      state.clientEngagement.getList.isLoading = false;
      const responseData = action.payload?.message || action.payload?.data || action.payload;
      state.clientEngagement.getList.data = responseData;
      state.clientEngagement.getList.status = action.payload?.status || 200;
      state.clientEngagement.getList.error = null;

      // Extract columns from response if available
      if (responseData?.columns && Array.isArray(responseData.columns)) {
        state.clientEngagement.columnPreferences.data = responseData.columns;
        state.clientEngagement.columnPreferences.error = null;
      }
    });

    builder.addCase(getClientEngagementTaskList.rejected, (state, action) => {
      state.clientEngagement.getList.isLoading = false;
      state.clientEngagement.getList.error = action.payload;
      state.clientEngagement.getList.status = action.payload?.status || 500;
    });

    builder.addCase(getClientOnboardingColumnPreferences.pending, (state) => {
      state.clientOnboarding.columnPreferences.isLoading = true;
      state.clientOnboarding.columnPreferences.error = null;
      state.clientOnboarding.columnPreferences.status = null;
    });

    builder.addCase(getClientOnboardingColumnPreferences.fulfilled, (state, action) => {
      state.clientOnboarding.columnPreferences.isLoading = false;
      state.clientOnboarding.columnPreferences.data =
        action.payload?.message || action.payload?.data || action.payload;
      state.clientOnboarding.columnPreferences.status = action.payload?.status || 200;
      state.clientOnboarding.columnPreferences.error = null;
    });

    builder.addCase(getClientOnboardingColumnPreferences.rejected, (state, action) => {
      state.clientOnboarding.columnPreferences.isLoading = false;
      state.clientOnboarding.columnPreferences.error = action.payload;
      state.clientOnboarding.columnPreferences.status = action.payload?.status || 500;
    });

    builder.addCase(saveClientOnboardingColumnPreferences.pending, (state) => {
      state.clientOnboarding.columnPreferences.isLoading = true;
      state.clientOnboarding.columnPreferences.error = null;
    });

    builder.addCase(saveClientOnboardingColumnPreferences.fulfilled, (state) => {
      state.clientOnboarding.columnPreferences.isLoading = false;
      state.clientOnboarding.columnPreferences.error = null;
    });

    builder.addCase(saveClientOnboardingColumnPreferences.rejected, (state, action) => {
      state.clientOnboarding.columnPreferences.isLoading = false;
      state.clientOnboarding.columnPreferences.error = action.payload;
    });

    builder.addCase(getClientExitColumnPreferences.pending, (state) => {
      state.clientExit.columnPreferences.isLoading = true;
      state.clientExit.columnPreferences.error = null;
      state.clientExit.columnPreferences.status = null;
    });

    builder.addCase(getClientExitColumnPreferences.fulfilled, (state, action) => {
      state.clientExit.columnPreferences.isLoading = false;
      state.clientExit.columnPreferences.data =
        action.payload?.message || action.payload?.data || action.payload;
      state.clientExit.columnPreferences.status = action.payload?.status || 200;
      state.clientExit.columnPreferences.error = null;
    });

    builder.addCase(getClientExitColumnPreferences.rejected, (state, action) => {
      state.clientExit.columnPreferences.isLoading = false;
      state.clientExit.columnPreferences.error = action.payload;
      state.clientExit.columnPreferences.status = action.payload?.status || 500;
    });

    builder.addCase(saveClientExitColumnPreferences.pending, (state) => {
      state.clientExit.columnPreferences.isLoading = true;
      state.clientExit.columnPreferences.error = null;
    });

    builder.addCase(saveClientExitColumnPreferences.fulfilled, (state) => {
      state.clientExit.columnPreferences.isLoading = false;
      state.clientExit.columnPreferences.error = null;
    });

    builder.addCase(saveClientExitColumnPreferences.rejected, (state, action) => {
      state.clientExit.columnPreferences.isLoading = false;
      state.clientExit.columnPreferences.error = action.payload;
    });

    builder.addCase(getClientEngagementColumnPreferences.pending, (state) => {
      state.clientEngagement.columnPreferences.isLoading = true;
      state.clientEngagement.columnPreferences.error = null;
      state.clientEngagement.columnPreferences.status = null;
    });

    builder.addCase(getClientEngagementColumnPreferences.fulfilled, (state, action) => {
      state.clientEngagement.columnPreferences.isLoading = false;
      state.clientEngagement.columnPreferences.data =
        action.payload?.message || action.payload?.data || action.payload;
      state.clientEngagement.columnPreferences.status = action.payload?.status || 200;
      state.clientEngagement.columnPreferences.error = null;
    });

    builder.addCase(getClientEngagementColumnPreferences.rejected, (state, action) => {
      state.clientEngagement.columnPreferences.isLoading = false;
      state.clientEngagement.columnPreferences.error = action.payload;
      state.clientEngagement.columnPreferences.status = action.payload?.status || 500;
    });

    builder.addCase(saveClientEngagementColumnPreferences.pending, (state) => {
      state.clientEngagement.columnPreferences.isLoading = true;
      state.clientEngagement.columnPreferences.error = null;
    });

    builder.addCase(saveClientEngagementColumnPreferences.fulfilled, (state) => {
      state.clientEngagement.columnPreferences.isLoading = false;
      state.clientEngagement.columnPreferences.error = null;
    });

    builder.addCase(saveClientEngagementColumnPreferences.rejected, (state, action) => {
      state.clientEngagement.columnPreferences.isLoading = false;
      state.clientEngagement.columnPreferences.error = action.payload;
    });

    builder.addCase(fetchClientTaskTags.pending, (state) => {
      state.clientTaskTags.isLoading = true;
      state.clientTaskTags.error = null;
    });

    builder.addCase(fetchClientTaskTags.fulfilled, (state, action) => {
      state.clientTaskTags.isLoading = false;
      state.clientTaskTags.data = action.payload || action.payload?.message;
    });

    builder.addCase(fetchClientTaskTags.rejected, (state, action) => {
      state.clientTaskTags.isLoading = false;
      state.clientTaskTags.error = action.payload;
    });
  },
});

export default settingSlice.reducer;
