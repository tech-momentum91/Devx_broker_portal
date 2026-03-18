import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getBrokerDashboardSummary } from '@/services/broker-dashboard-service';

const initialState = {
  summary: {
    data: null,
    isLoading: false,
    error: null,
  },
};

export const fetchBrokerDashboardSummary = createAsyncThunk(
  'brokerDashboard/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      return await getBrokerDashboardSummary();
    } catch (error) {
      return rejectWithValue(error?.message ?? error);
    }
  },
);

const brokerDashboardSlice = createSlice({
  name: 'brokerDashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBrokerDashboardSummary.pending, (state) => {
        state.summary.isLoading = true;
        state.summary.error = null;
      })
      .addCase(fetchBrokerDashboardSummary.fulfilled, (state, action) => {
        state.summary.isLoading = false;
        state.summary.error = null;
        state.summary.data = action.payload ?? null;
      })
      .addCase(fetchBrokerDashboardSummary.rejected, (state, action) => {
        state.summary.isLoading = false;
        state.summary.data = null;
        state.summary.error =
          action.payload ?? action.error?.message ?? 'Failed to load dashboard';
      });
  },
});

export default brokerDashboardSlice.reducer;

export const selectBrokerDashboardSummary = (state) =>
  state.brokerDashboard?.summary ?? { data: null, isLoading: false, error: null };

