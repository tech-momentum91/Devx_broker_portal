import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '@/api/axios';

const serializeError = (error) => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  return error?.message || 'Something went wrong while fetching team members';
};

const initialState = {
  addTeamMemberModal: {
    isOpen: false,
    isLoading: false,
    error: null,
    status: null,
    editData: null,
  },

  teamUserDetailModal: {
    isOpen: false,
    isLoading: false,
    error: null,
    status: null,
  },
};

const teamManagementSlice = createSlice({
  name: 'teamManagement',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    resetFilters: (state) => {
      state.filters = initialState.filters;
    },

    setAddTeamMemberModal: (state, action) => {
      if (typeof action.payload === 'boolean') {
        state.addTeamMemberModal.isOpen = action.payload;
        if (!action.payload) {
          state.addTeamMemberModal.editData = null;
          state.addTeamMemberModal.error = null;
          state.addTeamMemberModal.status = null;
        }
      } else if (typeof action.payload === 'object' && action.payload !== null) {
        // Handle object payload with isOpen and editData
        state.addTeamMemberModal.isOpen = action.payload.isOpen ?? true;
        state.addTeamMemberModal.editData = action.payload.editData ?? null;
        if (!action.payload.isOpen) {
          state.addTeamMemberModal.editData = null;
          state.addTeamMemberModal.error = null;
          state.addTeamMemberModal.status = null;
        }
      } else {
        state.addTeamMemberModal.isOpen = !state.addTeamMemberModal.isOpen;
        if (!state.addTeamMemberModal.isOpen) {
          state.addTeamMemberModal.editData = null;
          state.addTeamMemberModal.error = null;
          state.addTeamMemberModal.status = null;
        }
      }
    },

    setTeamUserDetailModal: (state, action) => {
      state.teamUserDetailModal.isOpen =
        typeof action.payload === 'boolean' ? action.payload : !state.teamUserDetailModal.isOpen;
      if (!state.teamUserDetailModal.isOpen) {
        state.teamUserDetailModal.error = null;
        state.teamUserDetailModal.status = null;
      }
    },
  },
});

export const {
  setFilters,
  resetFilters,
  setAddTeamMemberModal,
  setEditTeamMemberModal,
  setDeleteTeamMemberModal,
  setTeamUserDetailModal,
} = teamManagementSlice.actions;

export default teamManagementSlice.reducer;

/* --------------------------- SELECTORS --------------------------- */

export const selectAddTeamMemberModal = (state) =>
  state.teamManagement?.addTeamMemberModal || initialState.addTeamMemberModal;
