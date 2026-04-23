import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  submitLeadFromBrokerPortal,
  getShortSubmitLeadErrorMessage,
  BROKER_SUBMIT_LEAD_ERROR_FALLBACK,
} from '@/services/lead-submit-service';

const initialState = {
  submitStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  submitError: null,
  lastCreatedLeadName: null,
};

export const submitLead = createAsyncThunk(
  'leadSubmit/submitLead',
  async (payload, { rejectWithValue }) => {
    try {
      return await submitLeadFromBrokerPortal(payload);
    } catch (error) {
      const message = getShortSubmitLeadErrorMessage(
        error?.response?.data ?? error?.message ?? error,
      );
      return rejectWithValue(message || BROKER_SUBMIT_LEAD_ERROR_FALLBACK);
    }
  },
);

const leadSubmitSlice = createSlice({
  name: 'leadSubmit',
  initialState,
  reducers: {
    resetSubmitState(state) {
      state.submitStatus = 'idle';
      state.submitError = null;
      state.lastCreatedLeadName = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitLead.pending, (state) => {
        state.submitStatus = 'loading';
        state.submitError = null;
        state.lastCreatedLeadName = null;
      })
      .addCase(submitLead.fulfilled, (state, action) => {
        state.submitStatus = 'succeeded';
        state.submitError = null;
        state.lastCreatedLeadName = action.payload?.name ?? null;
      })
      .addCase(submitLead.rejected, (state, action) => {
        state.submitStatus = 'failed';
        state.submitError =
          action.payload ??
          getShortSubmitLeadErrorMessage(action.error?.message) ??
          BROKER_SUBMIT_LEAD_ERROR_FALLBACK;
        state.lastCreatedLeadName = null;
      });
  },
});

export const { resetSubmitState } = leadSubmitSlice.actions;
export default leadSubmitSlice.reducer;

export const selectLeadSubmitStatus = (state) => state.leadSubmit?.submitStatus ?? 'idle';
export const selectLeadSubmitError = (state) => state.leadSubmit?.submitError ?? null;
export const selectLastCreatedLeadName = (state) => state.leadSubmit?.lastCreatedLeadName ?? null;
