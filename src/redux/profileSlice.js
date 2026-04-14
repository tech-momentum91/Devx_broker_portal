import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '@/api/axios';
import { fetchAllocatedSpaceListview } from './spaceSlice';

const initialState = {
  profile_all_users: {
    data: [],
    isLoading: false,
    error: null,
    status: null,
  },

  companyProfile: {
    data: null,
    isLoading: false,
    error: null,
    status: null,
    editable: null,
  },

  profileData: {
    full_name: '',
    email: '',
    bio: '',
    profile_image: '',
    profile_image_id: '',
    isLoading: false,
    error: null,
  },

  changePasswordData: {
    status: null,
    error: null,
    isLoading: false,
  },
  disableUserWithReassign: {
    isLoading: false,
    error: null,
    status: null,
  },
  usersProfile: {
    modal: {
      isOpen: false,
    },
  },

  rolesPermission: {
    frontPageData: {
      data: [],
      isLoading: false,
      error: null,
      status: null,
    },
    permissionsData: {
      data: null,
      isLoading: false,
      error: null,
      status: null,
    },
    modalData: {
      data: [],
      isLoading: false,
      error: null,
      status: null,
    },
    modal: {
      isOpen: false,
      data: null,
    },
    isLoading: false,
    error: null,
    status: null,
  },

  removeUser: {
    modal: {
      isOpen: false,
      data: null,
    },
    status: null,
    error: null,
    data: null,
    isLoading: false,
  },

  addUser: {
    userEmails: [],
    isLoading: false,
    error: null,
    data: null,
    status: null,
  },

  editUser: {
    modal: {
      isOpen: false,
      data: null,
    },
    isLoading: false,
    error: null,
    data: null,
    status: null,
  },

  listOfUsersWithFilters: {
    data: { results: [] },
    columns: [],
    isLoading: false,
    isLoadingMore: false,
    error: null,
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    isSavingColumns: false,
    saveColumnsError: null,
    page: 1,
    pageSize: 20,
    hasMore: false,
  },

  clientList: {
    data: [],
    isLoading: false,
    error: null,
    status: null,
  },

  /** Broker portal: CP Contact profile for logged-in user (My Account page) */
  cpContactProfile: {
    data: null,
    isLoading: false,
    error: null,
    saving: false,
    saveError: null,
  },
};

export const uploadProfileImageUser = createAsyncThunk(
  'profile/uploadProfileImageUser',
  async (formData, { rejectWithValue }) => {
    try {
      // Extract values from incoming formData
      const file = formData.get('file');
      const doctype = formData.get('doctype') || 'User';
      const docname = formData.get('docname') || formData.get('doc_name');
      const filename = file?.name || 'profile_image';
      // Determine field_name based on doctype
      const fieldName =
        doctype === 'Customer' ? 'image' : doctype === 'Company' ? 'company_logo' : 'user_image';
      // Create new formData with all required fields for the new API
      const uploadFormData = new FormData();
      uploadFormData.append('doctype', doctype);
      uploadFormData.append('docname', docname);
      uploadFormData.append('fieldname', fieldName);
      uploadFormData.append('filename', filename);
      uploadFormData.append('file', file);
      uploadFormData.append('is_private', '0');

      // Use the new API endpoint
      const response = await apiClient.post(
        '/method/devx.api.core.upload_attachment',
        uploadFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const deleteFileByUrl = createAsyncThunk(
  'profile/deleteFileByUrl',
  async (fileUrl, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/method/devx.api.core.delete_file_by_url', {
        file_url: fileUrl,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

// Async thunk to save profile data
export const saveProfile = createAsyncThunk(
  'profile/saveProfile',
  async (data, { rejectWithValue }) => {
    // console.log('save profile thunk hartikkkkkk------', data);

    try {
      // Use relative path since apiClient already has baseURL with /api
      const response = await apiClient.put(`/resource/User/${data.email}`, data);

      // console.log('response from save profile thunk', response);

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

/** Broker portal: get CP Contact for logged-in user (My Account / profile page) */
export const getCpContactProfile = createAsyncThunk(
  'profile/getCpContactProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/method/devx.channel_partner.api.channel_partner.get_my_cp_contact', {
        withCredentials: true,
      });
      const body = response?.data;
      const raw = body?.message !== undefined ? body.message : body;
      return raw;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to load profile',
      );
    }
  },
);

/** Broker portal: PATCH CP Contact via channel_partner.update_cp_contact (camelCase payload). */
export const updateCpContactProfile = createAsyncThunk(
  'profile/updateCpContactProfile',
  async ({ name, payload }, { rejectWithValue }) => {
    if (!name) {
      return rejectWithValue('Missing CP Contact id');
    }
    try {
      const response = await apiClient.post(
        '/method/devx.channel_partner.api.channel_partner.update_cp_contact',
        { name, payload },
        { withCredentials: true },
      );
      const result = response.data;
      if (result?.exc_type) {
        let msg = result.message;
        if (result._server_messages) {
          try {
            const arr = JSON.parse(result._server_messages);
            if (Array.isArray(arr) && arr.length) {
              const last = arr[arr.length - 1];
              const parsed = typeof last === 'string' ? JSON.parse(last) : last;
              msg = parsed?.message || msg;
            }
          } catch {
            /* keep result.message */
          }
        }
        return rejectWithValue(msg || 'Failed to save profile');
      }
      return result?.message ?? result;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.response?.data?.exc ||
          error.message ||
          'Failed to save profile',
      );
    }
  },
);

// Async thunk to get profile data
export const getProfile = createAsyncThunk(
  'profile/getProfile',
  async (email, { rejectWithValue }) => {
    // console.log('email in get profile thunk', email);
    // alert('email in get profile thunk', email);

    try {
      // Use relative path since apiClient already has baseURL with /api
      const response = await apiClient.get(`/resource/User/${email}`, {
        withCredentials: true,
      });
      // console.log('response', response);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const resetPasswordProfile = createAsyncThunk(
  'profile/resetPasswordProfile',
  async (data, { rejectWithValue }) => {
    try {
      // Use relative path since apiClient already has baseURL with /api
      const response = await apiClient.post(
        '/method/devx.overrides.user.check_and_update_password',
        {
          old_password: data.currentPassword,
          new_password: data.newPassword,
        },
        {
          withCredentials: true,
        },
      );
      // console.log('response in reset password profile', response);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const addUser = createAsyncThunk('profile/addUser', async (data, { rejectWithValue }) => {
  // console.log('add user api called', data);
  try {
    // Build the payload object
    const payload = {
      email: data.emailAddress,
      role: data.role,
      full_name: data.fullName,
    };

    // Include org_id if present (for Client User/Client Admin)
    if (data.org_id) {
      payload.org_id = data.org_id;
    }

    // Include center if present (for other roles)
    if (data.centers) {
      payload.center = data.centers;
    }

    // Use relative path since apiClient already has baseURL with /api
    const response = await apiClient.post('/method/devx.api.user.create_user', payload, {
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    return rejectWithValue(error);
  }
});

export const updateUser = createAsyncThunk(
  'profile/updateUser',
  async (data, { rejectWithValue }) => {
    // console.log('update user api called', data);
    try {
      // Use relative path since apiClient already has baseURL with /api
      const response = await apiClient.put(
        `/resource/User/${data.emailAddress}`,
        {
          first_name: data.full_name,
          center: data.center,
          user_role: data.user_role,
          org_id: data.org_id,
        },
        {
          withCredentials: true,
        },
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getUsersProfile = createAsyncThunk(
  'profile/getUsersProfile',
  async (_, { rejectWithValue }) => {
    try {
      // Use relative path since apiClient already has baseURL with /api
      const response = await apiClient.get('/resource/User?expand_links=true&fields=["*"]', {
        withCredentials: true,
      });

      // console.log('response from getUsersProfile thunk', response);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const removeUserProfile = createAsyncThunk(
  'profile/removeUserProfile',
  async (profile_image, { rejectWithValue }) => {
    try {
      // Use relative path since apiClient already has baseURL with /api
      // withCredentials is already set in apiClient instance, no need to set it again
      console.log('profile_image in removeUserProfile', profile_image);
      const payload = {
        file_url: profile_image,
      };
      const response = await apiClient.deletes(
        '/method/devx.overrides.user.delete_file_by_url',
        payload,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const disableUserWithReassignTodos = createAsyncThunk(
  'profile/disableUserWithReassignTodos',
  async ({ user_email, replacement_user_email }, { rejectWithValue }) => {
    try {
      const current_user = user_email;
      const new_user = replacement_user_email;
      const response = await apiClient.post(
        '/method/devx.overrides.user.user_disable_with_reassign_todos',
        { current_user, new_user },
        { withCredentials: true },
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getCompanyAndUserProfile = createAsyncThunk(
  'profile/getCompanyProfile',
  async (email, { rejectWithValue }) => {
    console.log('email from getCompanyProfile', email);
    try {
      const payload = {
        user: email,
      };
      console.log('payload from getCompanyProfile', payload);
      // Use relative path since apiClient already has baseURL with /api
      const response = await apiClient.post('/method/devx.api.user.get_user_profile', payload);
      console.log('response from getCompanyProfile', response);

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getListOfUsersWithFilters = createAsyncThunk(
  'profile/getListOfUsersWithFilters',
  async (params = {}, { rejectWithValue }) => {
    const {
      keyword = '',
      filters = {},
      page = 1,
      pageSize = 20,
      append = false,
    } = typeof params === 'string' ? { keyword: params } : params;

    try {
      // Build filters array
      const filtersArray = [];
      if (filters.center && Array.isArray(filters.center) && filters.center.length > 0) {
        if (filters.center.length === 1) {
          filtersArray.push(['center', '=', filters.center[0]]);
        } else {
          filtersArray.push(['center', 'in', filters.center]);
        }
      }
      if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
        if (filters.status.length === 1) {
          // Convert status value (1/0) to enabled field
          const enabled = filters.status[0] === '1' ? 1 : 0;
          filtersArray.push(['enabled', '=', enabled]);
        } else {
          // Multiple statuses - convert each and use 'in' operator
          const enabledValues = filters.status.map((status) => (status === '1' ? 1 : 0));
          filtersArray.push(['enabled', 'in', enabledValues]);
        }
      }
      if (filters.role && Array.isArray(filters.role) && filters.role.length > 0) {
        if (filters.role.length === 1) {
          filtersArray.push(['user_role', '=', filters.role[0]]);
        } else {
          filtersArray.push(['user_role', 'in', filters.role]);
        }
      }

      // Calculate hasMore based on response
      let results = [];
      let hasMore = false;

      //If filters exist, use the filters endpoint
      if (filtersArray.length > 0) {
        const formData = new FormData();
        formData.append('doctype', 'User');
        formData.append('filters', JSON.stringify(filtersArray));
        formData.append('limit_page_length', pageSize.toString());
        formData.append('page', page.toString());
        if (keyword.trim()) {
          formData.append('keyword', keyword.trim());
        }

        const response = await apiClient.post(
          '/method/devx.api.listview.user_list_with_search',
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } },
        );

        const responseData = response?.data?.message || response?.data || {};
        results = responseData.results || responseData.data || [];
        const totalCount = responseData.total_count || 0;
        const currentCount = append
          ? (responseData.current_count ?? results.length)
          : results.length;
        hasMore = currentCount < totalCount || results.length === pageSize;

        console.log('has more', hasMore);

        return {
          results,
          page,
          pageSize,
          append,
          hasMore,
          message: responseData, // Preserve original message for backward compatibility
          status: response?.data?.status || response?.status || 200,
        };
      }

      // No filters, use the regular search endpoint with pagination
      const response = await apiClient.post('/method/devx.api.listview.user_list_with_search', {
        doctype: 'User',
        keyword: keyword || '',
        order_by: 'creation desc',
        limit_page_length: pageSize,
        page,
      });

      const responseData = response?.data?.message || response?.data || {};
      results = responseData.results || responseData.data || [];
      const totalCount = responseData.total_count || 0;

      // Calculate hasMore: check if current page is less than total pages
      // Also check if we got a full page of results (indicating there might be more)
      const currentPage = Number(page) || 1;
      const totalPages = Number(responseData?.total_pages) || 0;
      const resultCount = results.length;
      const pageSizeNumber = Number(pageSize) || 20;

      // hasMore is true if:
      // 1. Current page is less than total pages, OR
      // 2. We got a full page of results (resultCount === pageSize) and totalPages > currentPage
      hasMore =
        currentPage < totalPages || (resultCount === pageSizeNumber && totalPages > currentPage);

      return {
        results,
        page,
        pageSize,
        append,
        hasMore,
        message: responseData, // Preserve original message for backward compatibility
        status: response?.data?.status || response?.status || 200,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getListOfUserEmails = createAsyncThunk(
  'profile/getListOfUserEmails',
  async (keyword = '', { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/method/devx.api.user.get_active_outlook_emails', {
        keyword: keyword || '',
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getRolesWithDescription = createAsyncThunk(
  'profile/getRolesWithDescription',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/method/devx.api.user.get_roles', {});
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getPermissionsForRole = createAsyncThunk(
  'profile/getPermissionsForRole',
  async (roleName, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(
        '/method/devx.api.user.get_role_permissions',
        {
          role: roleName,
        },
        {
          withCredentials: true,
        },
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getListViewColumns = createAsyncThunk(
  'profile/getListViewColumns',
  async (doctype, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/method/devx.api.listview.get_list_pref', {
        doctype,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const saveListViewColumns = createAsyncThunk(
  'profile/saveListViewColumns',
  async ({ doctype, columns }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/method/devx.api.listview.save_list_pref', {
        doctype,
        columns,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getClientList = createAsyncThunk(
  'profile/getClientList',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(
        'resource/Customer?fields=["name","customer_name","custom_display_name"]&order_by=creation&limit_page_length=999',
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const updateCompanyProfileThunk = createAsyncThunk(
  'profile/updateCompanyProfile',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(
        '/method/devx.api.user.update_company_profile',
        payload,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearCpContactSaveError: (state) => {
      state.cpContactProfile.saveError = null;
    },

    setModalOpen: (state, action) => {
      state.usersProfile.modal.isOpen = action.payload;
    },
    setModalClose: (state) => {
      state.usersProfile.modal.isOpen = false;
    },
    setRolesPermissionModalOpen: (state, action) => {
      state.rolesPermission.modal.isOpen = true;
      state.rolesPermission.modal.data = action.payload;
    },
    setRolesPermissionModalClose: (state) => {
      state.rolesPermission.modal.isOpen = false;
      state.rolesPermission.modal.data = null;
    },
    setRemoveUserModalOpen: (state, action) => {
      state.removeUser.modal.isOpen = true;
      state.removeUser.modal.data = action.payload;
    },
    setRemoveUserModalClose: (state) => {
      state.removeUser.modal.isOpen = false;
      state.removeUser.modal.data = null;
    },
    setEditUserModalOpen: (state, action) => {
      state.editUser.modal.isOpen = true;
      state.editUser.modal.data = action.payload;
    },
    setEditUserModalClose: (state) => {
      state.editUser.modal.isOpen = false;
      state.editUser.modal.data = null;
    },
    updateProfileData: (state, action) => {
      state.profileData = { ...state.profileData, ...action.payload };
    },
    resetUsersList: (state) => {
      // Clear the results to show skeleton during new search
      state.listOfUsersWithFilters.data = { results: [] };
      state.listOfUsersWithFilters.page = 1;
      state.listOfUsersWithFilters.hasMore = false;
      state.listOfUsersWithFilters.isLoadingMore = false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(getProfile.pending, (state, action) => {
      state.profileData.isLoading = true;
      state.profileData.error = null;
    });

    builder.addCase(getProfile.fulfilled, (state, action) => {
      console.log('data in slive of profile', action.payload);
      state.profileData.isLoading = false;
      state.profileData.full_name = action.payload.data.full_name;
      state.profileData.email = action.payload.data.email;
      state.profileData.bio = action.payload.data.bio;
      state.profileData.profile_image = action.payload.data.user_image;
      state.profileData.status = action.payload.status;
      state.profileData.org_id = action.payload.data.org_id;
    });

    builder.addCase(getProfile.rejected, (state, action) => {
      state.profileData.isLoading = false;
      state.profileData.error = action.payload || action.error.message;
    });

    builder.addCase(getCpContactProfile.pending, (state) => {
      state.cpContactProfile.isLoading = true;
      state.cpContactProfile.error = null;
      state.cpContactProfile.saveError = null;
    });
    builder.addCase(getCpContactProfile.fulfilled, (state, action) => {
      state.cpContactProfile.isLoading = false;
      state.cpContactProfile.data = action.payload;
      state.cpContactProfile.error = null;
    });
    builder.addCase(getCpContactProfile.rejected, (state, action) => {
      state.cpContactProfile.isLoading = false;
      state.cpContactProfile.data = null;
      state.cpContactProfile.error = action.payload || action.error?.message;
    });

    builder.addCase(updateCpContactProfile.pending, (state) => {
      state.cpContactProfile.saving = true;
      state.cpContactProfile.saveError = null;
    });
    builder.addCase(updateCpContactProfile.fulfilled, (state) => {
      state.cpContactProfile.saving = false;
      state.cpContactProfile.saveError = null;
    });
    builder.addCase(updateCpContactProfile.rejected, (state, action) => {
      state.cpContactProfile.saving = false;
      state.cpContactProfile.saveError = action.payload || action.error?.message || 'Save failed';
    });

    builder.addCase(saveProfile.pending, (state, action) => {
      state.profileData.isLoading = true;
      state.profileData.error = null;
    });

    builder.addCase(saveProfile.fulfilled, (state, action) => {
      state.profileData.isLoading = false;
      state.profileData.full_name = action.payload.data.full_name;
      state.profileData.email = action.payload.data.email;
      state.profileData.bio = action.payload.data.bio;
      state.profileData.profile_image = action.payload.data.user_image;
      state.profileData.status = action.payload.status;
    });

    builder.addCase(saveProfile.rejected, (state, action) => {
      state.profileData.isLoading = false;
      state.profileData.error = action.payload || action.error.message;
    });

    builder.addCase(resetPasswordProfile.pending, (state, action) => {
      state.changePasswordData.isLoading = true;
      state.changePasswordData.error = null;
    });

    builder.addCase(resetPasswordProfile.fulfilled, (state, action) => {
      // console.log('response in fulfilled of reset password profile', action.payload);
      state.changePasswordData.isLoading = false;
      state.changePasswordData.error = null;
      state.changePasswordData.status = action.payload.status;
    });

    builder.addCase(resetPasswordProfile.rejected, (state, action) => {
      state.changePasswordData.isLoading = false;
      state.changePasswordData.error = action.payload || action.error.message;
    });

    builder.addCase(addUser.pending, (state) => {
      state.addUser.isLoading = true;
      state.addUser.error = null;
    });

    builder.addCase(addUser.fulfilled, (state, action) => {
      state.addUser.isLoading = false;
      state.addUser.data = action.payload?.data || action.payload;
      state.addUser.status = action.payload?.status || 'success';
    });

    builder.addCase(addUser.rejected, (state, action) => {
      state.addUser.isLoading = false;
      state.addUser.error = action.payload || action.error.message;
    });

    builder.addCase(updateUser.pending, (state) => {
      state.editUser.isLoading = true;
      state.editUser.error = null;
    });

    builder.addCase(updateUser.fulfilled, (state, action) => {
      state.editUser.isLoading = false;
      state.editUser.data = action.payload?.data || action.payload;
      state.editUser.status = action.payload?.status || 'success';
    });

    builder.addCase(updateUser.rejected, (state, action) => {
      state.editUser.isLoading = false;
      state.editUser.error = action.payload || action.error.message;
    });

    builder.addCase(getUsersProfile.pending, (state) => {
      state.profile_all_users.isLoading = true;
      state.profile_all_users.error = null;
    });

    builder.addCase(getUsersProfile.fulfilled, (state, action) => {
      state.profile_all_users.isLoading = false;
      state.profile_all_users.error = null;
      state.profile_all_users.data = action.payload?.data || action.payload;
      state.profile_all_users.status = action.payload?.status || 200;
      state.profileData.status = 200;
    });

    builder.addCase(getUsersProfile.rejected, (state, action) => {
      state.profile_all_users.isLoading = false;
      state.profile_all_users.error = action.payload || action.error?.message;
      state.profile_all_users.status = action.payload?.httpStatus || null;
    });

    builder.addCase(removeUserProfile.pending, (state) => {
      state.removeUser.isLoading = true;
      state.removeUser.error = null;
    });

    builder.addCase(removeUserProfile.fulfilled, (state, action) => {
      state.removeUser.isLoading = false;
      state.removeUser.data = action.payload?.data || action.payload;
      state.removeUser.status = action.payload?.status || 'success';
      state.profileData.profile_image = null;
      state.profileData.profile_image_id = null;
    });

    builder.addCase(removeUserProfile.rejected, (state, action) => {
      state.removeUser.isLoading = false;
      state.removeUser.error = action.payload || action.error.message;
    });

    builder.addCase(disableUserWithReassignTodos.pending, (state) => {
      state.disableUserWithReassign.isLoading = true;
      state.disableUserWithReassign.error = null;
    });

    builder.addCase(disableUserWithReassignTodos.fulfilled, (state, action) => {
      state.disableUserWithReassign.isLoading = false;
      state.disableUserWithReassign.data = action.payload?.data || action.payload;
      state.disableUserWithReassign.status = action.payload?.status || 'success';
    });

    builder.addCase(disableUserWithReassignTodos.rejected, (state, action) => {
      state.disableUserWithReassign.isLoading = false;
      state.disableUserWithReassign.error = action.payload || action.error.message;
    });

    builder.addCase(getCompanyAndUserProfile.pending, (state) => {
      state.companyProfile.isLoading = true;
      state.profileData.isLoading = true;
      state.companyProfile.error = null;
      state.profileData.error = null;
    });

    builder.addCase(getCompanyAndUserProfile.fulfilled, (state, action) => {
      // Handle response structure: response.data.message or response.data or response.message

      const responseData =
        action.payload?.message ||
        action.payload?.data?.message ||
        action.payload?.data ||
        action.payload;

      // Update company profile state
      state.companyProfile.isLoading = false;
      state.companyProfile.data = {
        message: {
          is_internal: responseData.is_internal || '',
          company_name: responseData.company_name || '',
          company_logo: responseData.company_logo || '',
          company_description: responseData.company_description || null,
          company_website: responseData.company_website || '',
          editable: responseData.editable,
        },
      };
      state.companyProfile.status = action.payload?.status || 200;
      state.companyProfile.error = null;

      // Update user profile state
      state.profileData.isLoading = false;
      state.profileData.full_name = responseData.full_name || '';
      state.profileData.email = responseData.email || '';
      state.profileData.profile_image = responseData.user_image || '';
      state.profileData.status = action.payload?.status || 200;
      state.profileData.error = null;
    });

    builder.addCase(getCompanyAndUserProfile.rejected, (state, action) => {
      state.companyProfile.isLoading = false;
      state.profileData.isLoading = false;
      state.companyProfile.error = action.payload || action.error.message;
      state.profileData.error = action.payload || action.error.message;
    });

    builder.addCase(uploadProfileImageUser.pending, (state) => {
      state.profileData.isLoading = true;
      state.profileData.error = null;
    });

    builder.addCase(uploadProfileImageUser.fulfilled, (state, action) => {
      state.profileData.isLoading = false;
      state.profileData.profile_image = action.payload?.message.file_url || action.payload;
      state.profileData.profile_image_id = action.payload?.message.name;
    });

    builder.addCase(uploadProfileImageUser.rejected, (state, action) => {
      state.profileData.isLoading = false;
      state.profileData.error = action.payload || action.error.message;
    });

    builder.addCase(deleteFileByUrl.pending, (state) => {
      state.profileData.isLoading = true;
      state.profileData.error = null;
    });

    builder.addCase(deleteFileByUrl.fulfilled, (state) => {
      state.profileData.isLoading = false;
      // Don't clear profile_image here - let the components refresh the appropriate data
      // This prevents clearing user profile_image when deleting company logo
    });

    builder.addCase(deleteFileByUrl.rejected, (state, action) => {
      state.profileData.isLoading = false;
      state.profileData.error = action.payload || action.error.message;
    });

    builder.addCase(getListOfUsersWithFilters.pending, (state, action) => {
      const isAppend = action.meta.arg?.append || false;
      state.listOfUsersWithFilters.status = 'loading';
      state.listOfUsersWithFilters.error = null;
      if (isAppend) {
        state.listOfUsersWithFilters.isLoadingMore = true;
      } else {
        state.listOfUsersWithFilters.isLoading = true;
      }
    });

    builder.addCase(getListOfUsersWithFilters.fulfilled, (state, action) => {
      state.listOfUsersWithFilters.isLoading = false;
      state.listOfUsersWithFilters.isLoadingMore = false;
      state.listOfUsersWithFilters.status = 'succeeded';
      state.listOfUsersWithFilters.error = null;

      const { results, page, pageSize, append, hasMore, message } = action.payload;

      // Update pagination state
      state.listOfUsersWithFilters.page = page;
      state.listOfUsersWithFilters.pageSize = pageSize;
      state.listOfUsersWithFilters.hasMore = hasMore ?? false;

      // Handle append logic for scroll pagination
      if (append && Array.isArray(results)) {
        // Append new results to existing results, avoiding duplicates
        const existingResults = state.listOfUsersWithFilters.data?.results || [];
        const existingIds = new Set(existingResults.map((item) => item.email || item.name));
        const newResults = results.filter((item) => !existingIds.has(item.email || item.name));
        state.listOfUsersWithFilters.data = {
          ...(message || state.listOfUsersWithFilters.data),
          results: [...existingResults, ...newResults],
        };
      } else {
        // Replace results for new search/filter
        state.listOfUsersWithFilters.data = {
          ...message,
          results: results || [],
        };
      }
    });

    builder.addCase(getListOfUsersWithFilters.rejected, (state, action) => {
      state.listOfUsersWithFilters.isLoading = false;
      state.listOfUsersWithFilters.isLoadingMore = false;
      state.listOfUsersWithFilters.status = 'failed';
      state.listOfUsersWithFilters.error = action.payload || action.error.message;
    });

    builder.addCase(getRolesWithDescription.pending, (state) => {
      state.rolesPermission.frontPageData.isLoading = true;
      state.rolesPermission.frontPageData.error = null;
    });

    builder.addCase(getRolesWithDescription.fulfilled, (state, action) => {
      // console.log('action in fulfilled of getRolesWithDescription', action.payload);
      state.rolesPermission.frontPageData.isLoading = false;
      // API returns: { message: [{name: '...', description: null}, ...] }
      state.rolesPermission.frontPageData.data =
        action.payload?.message || action.payload?.data?.message || action.payload;
      state.rolesPermission.frontPageData.status = action.payload?.status || 200;
      state.rolesPermission.frontPageData.error = null;
    });

    builder.addCase(getRolesWithDescription.rejected, (state, action) => {
      state.rolesPermission.frontPageData.isLoading = false;
      state.rolesPermission.frontPageData.error = action.payload || action.error.message;
    });

    builder.addCase(getPermissionsForRole.pending, (state) => {
      state.rolesPermission.permissionsData.isLoading = true;
      state.rolesPermission.permissionsData.error = null;
    });

    builder.addCase(getPermissionsForRole.fulfilled, (state, action) => {
      state.rolesPermission.permissionsData.isLoading = false;
      state.rolesPermission.permissionsData.data =
        action.payload?.message || action.payload?.data?.message || action.payload;
      state.rolesPermission.permissionsData.status = action.payload?.status || 200;
      state.rolesPermission.permissionsData.error = null;
    });

    builder.addCase(getPermissionsForRole.rejected, (state, action) => {
      state.rolesPermission.permissionsData.isLoading = false;
      state.rolesPermission.permissionsData.error = action.payload || action.error.message;
      state.rolesPermission.permissionsData.status = action.payload?.httpStatus || null;
    });

    builder.addCase(getListViewColumns.pending, (state) => {
      state.listOfUsersWithFilters.isLoading = true;
      state.listOfUsersWithFilters.error = null;
    });

    builder.addCase(getListViewColumns.fulfilled, (state, action) => {
      state.listOfUsersWithFilters.isLoading = false;
      state.listOfUsersWithFilters.columns = action.payload.message || action.payload;
    });

    builder.addCase(getListViewColumns.rejected, (state, action) => {
      state.listOfUsersWithFilters.isLoading = false;
      state.listOfUsersWithFilters.error = action.payload || action.error.message;
    });

    builder.addCase(saveListViewColumns.pending, (state) => {
      state.listOfUsersWithFilters.isSavingColumns = true;
      state.listOfUsersWithFilters.saveColumnsError = null;
    });

    builder.addCase(saveListViewColumns.fulfilled, (state) => {
      state.listOfUsersWithFilters.isSavingColumns = false;
      state.listOfUsersWithFilters.saveColumnsError = null;
    });

    builder.addCase(saveListViewColumns.rejected, (state, action) => {
      state.listOfUsersWithFilters.isSavingColumns = false;
      state.listOfUsersWithFilters.saveColumnsError = action.payload || action.error.message;
    });

    builder.addCase(getClientList.pending, (state) => {
      state.clientList.isLoading = true;
      state.clientList.error = null;
    });

    builder.addCase(getClientList.rejected, (state, action) => {
      state.clientList.isLoading = false;
      state.clientList.error = action.payload || action.error.message;
    });

    builder.addCase(getClientList.fulfilled, (state, action) => {
      state.clientList.isLoading = false;
      state.clientList.data = action.payload?.data || action.payload;
      state.clientList.status = action.payload?.status || 200;
      state.clientList.error = null;
    });

    builder.addCase(updateCompanyProfileThunk.pending, (state) => {
      state.companyProfile.isLoading = true;
      state.companyProfile.error = null;
    });

    builder.addCase(updateCompanyProfileThunk.fulfilled, (state, action) => {
      state.companyProfile.isLoading = false;
      state.companyProfile.error = null;
      state.companyProfile.status = action.payload?.status || 200;
      // Update company profile data if returned in response
      if (action.payload?.message) {
        state.companyProfile.data = {
          message: {
            ...state.companyProfile.data?.message,
            ...action.payload.message,
          },
        };
      }
    });

    builder.addCase(updateCompanyProfileThunk.rejected, (state, action) => {
      state.companyProfile.isLoading = false;
      state.companyProfile.error = action.payload || action.error.message;
    });

    builder.addCase(getListOfUserEmails.pending, (state) => {
      // state.addUser.isLoading = true;
      state.addUser.error = null;
    });

    builder.addCase(getListOfUserEmails.fulfilled, (state, action) => {
      state.addUser.userEmails = action.payload?.message?.results;
      // state.addUser.isLoading = false;
      state.addUser.error = null;
    });

    builder.addCase(getListOfUserEmails.rejected, (state, action) => {
      state.addUser.userEmails = [];
      // state.addUser.isLoading = false;
      state.addUser.error = action.payload || action.error.message;
    });
  },
});

export const {
  setLoading,
  setError,
  clearError,
  clearCpContactSaveError,
  updateProfileData,
  setModalOpen,
  setModalClose,
  setRolesPermissionModalOpen,
  setRolesPermissionModalClose,
  setRemoveUserModalOpen,
  setRemoveUserModalClose,
  setEditUserModalOpen,
  setEditUserModalClose,
  resetUsersList,
} = profileSlice.actions;
export default profileSlice.reducer;
