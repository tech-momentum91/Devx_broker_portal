import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Navbar from '@/components/navbar';
import DashboardHero from '@/components/broker-dashboard/dashboard-hero';
import RecentSubmissionsCard from '@/components/broker-dashboard/recent-submissions-card';
import DashboardSummaryCards from '@/components/broker-dashboard/dashboard-summary-cards';
import { useAuth } from '@/contexts/auth-context';
import { fetchBrokerDashboardSummary, selectBrokerDashboardSummary } from '@/redux/brokerDashboardSlice';
import {
  fetchRecentSubmissions,
  selectRecentSubmissions,
} from '@/redux/recentSubmissionsSlice';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const recent = useSelector(selectRecentSubmissions);
  const summaryState = useSelector(selectBrokerDashboardSummary);

  useEffect(() => {
    dispatch(fetchBrokerDashboardSummary());
    dispatch(fetchRecentSubmissions({ limit: 7 }));
  }, [dispatch]);

  const firstName = useMemo(() => {
    const full = String(user?.full_name ?? '').trim();
    if (!full) return '';
    return full.split(/\s+/)[0] ?? '';
  }, [user?.full_name]);

  return (
    <div className='min-h-dvh w-full bg-bg-weak-50'>
      <Navbar />
      <main className='max-w-7xl mx-auto w-full px-6 py-6'>
        <DashboardHero name={firstName || 'there'} />
        <div className='mt-6'>
          <RecentSubmissionsCard
            items={recent.data}
            isLoading={recent.isLoading}
            error={recent.error}
            limit={7}
          />
        </div>
        <DashboardSummaryCards
          summary={summaryState.data}
          isLoading={summaryState.isLoading}
        />
      </main>
    </div>
  );
};

export default Dashboard;
