import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer, { logoutSuccess } from '@/redux/authSlice';
import uiReducer from '@/redux/uiSlice';
import profileReducer from '@/redux/profileSlice';
import landlordReducer from '@/redux/landlordSlice';
import clientReducer from '@/redux/clientSlice';
import clientDetailReducer from '@/redux/clientDetailSlice';
import userReducer from '@/redux/userSlice';
import settingReducer from '@/redux/settingSlice';
import spaceReducer from '@/redux/spaceSlice';
import commonReducer from '@/redux/commonSlice';
import teamManagementReducer from '@/redux/teamManagementSlice';
import dashboardReducer from '@/redux/dashboardSlice';
import leadSubmitReducer from '@/redux/leadSubmitSlice';
import brokerDashboardReducer from '@/redux/brokerDashboardSlice';
import recentSubmissionsReducer from '@/redux/recentSubmissionsSlice';

const appReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  profile: profileReducer,
  landlord: landlordReducer,
  client: clientReducer,
  clientDetail: clientDetailReducer,
  user: userReducer,
  setting: settingReducer,
  space: spaceReducer,
  common: commonReducer,
  teamManagement: teamManagementReducer,
  dashboard: dashboardReducer,
  leadSubmit: leadSubmitReducer,
  brokerDashboard: brokerDashboardReducer,
  recentSubmissions: recentSubmissionsReducer,
});

// Reset redux state to initial values on logout to avoid leaking user data
const rootReducer = (state, action) => {
  if (action.type === logoutSuccess.type) {
    state = undefined;
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
});
