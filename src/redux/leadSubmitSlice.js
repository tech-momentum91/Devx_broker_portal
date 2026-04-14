import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { submitLeadFromBrokerPortal } from '@/services/lead-submit-service';

const initialState = {
  submitStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  submitError: null,
  lastCreatedLeadName: null,
};

function toErrorMessage(error) {
  if (!error) return 'Failed to submit lead';
  if (typeof error === 'string') return error;
  if (typeof error?.message === 'string') return error.message;
  if (typeof error?.exc === 'string') return error.exc;
  if (typeof error?.error === 'string') return error.error;
  try {
    return JSON.stringify(error);
  } catch {
    return 'Failed to submit lead';
  }
}

export const submitLead = createAsyncThunk(
  'leadSubmit/submitLead',
  async (payload, { rejectWithValue }) => {
    try {
      return await submitLeadFromBrokerPortal(payload);
    } catch (error) {
      const message = toErrorMessage(error?.response?.data) || toErrorMessage(error);
      return rejectWithValue(message);
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
        state.submitError = action.payload ?? action.error?.message ?? 'Failed to submit lead';
        state.lastCreatedLeadName = null;
      });
  },
});

export const { resetSubmitState } = leadSubmitSlice.actions;
export default leadSubmitSlice.reducer;

export const selectLeadSubmitStatus = (state) => state.leadSubmit?.submitStatus ?? 'idle';
export const selectLeadSubmitError = (state) => state.leadSubmit?.submitError ?? null;
export const selectLastCreatedLeadName = (state) => state.leadSubmit?.lastCreatedLeadName ?? null;
