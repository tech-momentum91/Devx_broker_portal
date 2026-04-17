import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getRecentSubmissions } from '@/services/recent-submissions-service';
import { parseAsyncListReject } from '@/redux/asyncRejectionUtils';

const initialState = {
  data: [],
  isLoading: false,
  error: null,
};

export const fetchRecentSubmissions = createAsyncThunk(
  'recentSubmissions/fetch',
  async ({ limit = 6 } = {}, { rejectWithValue }) => {
    try {
      return await getRecentSubmissions({ limit });
    } catch (error) {
      return rejectWithValue(error?.message ?? error);
    }
  },
);

const recentSubmissionsSlice = createSlice({
  name: 'recentSubmissions',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecentSubmissions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRecentSubmissions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.data = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchRecentSubmissions.rejected, (state, action) => {
        state.isLoading = false;
        const { message, clearCachedData } = parseAsyncListReject(
          action,
          'Failed to load recent submissions',
        );
        state.error = message;
        if (clearCachedData) {
          state.data = [];
        }
      });
  },
});

export default recentSubmissionsSlice.reducer;

export const selectRecentSubmissions = (state) =>
  state.recentSubmissions ?? { data: [], isLoading: false, error: null };

