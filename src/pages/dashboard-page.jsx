import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import PageLayout from '@/components/page-layout';
import * as Button from '@/components/ui/button';
import DashboardStatusTabs from '@/components/dashboard-status-tabs';
import { LeadSubmissionCard } from '@/components/dashboard';
import { getDefaultDashboardFilterLocalFilters } from '@/constants/dashboard-filter-constants';
import {
  fetchLeadSubmissions,
  fetchCrmStagesForExternal,
  selectSubmissions,
  selectExternalCrmStages,
} from '@/redux/dashboardSlice';
import { RiArrowRightSLine, RiStackLine } from 'react-icons/ri';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const submissions = useSelector(selectSubmissions);
  const externalCrmStages = useSelector(selectExternalCrmStages);
  const [activeTab, setActiveTab] = useState('managed');
  const [appliedFilters, setAppliedFilters] = useState(() =>
    getDefaultDashboardFilterLocalFilters({}),
  );

  const handleTabChange = useCallback((value) => {
    setActiveTab(value);
  }, []);

  useEffect(() => {
    dispatch(fetchCrmStagesForExternal());
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      fetchLeadSubmissions({
        tab: activeTab,
        filters: appliedFilters,
      }),
    );
  }, [dispatch, activeTab, appliedFilters]);

  const handleViewDetails = useCallback(
    (id) => {
      if (!id) return;
      navigate(`/submissions/${id}`);
    },
    [navigate],
  );

  // const sectionTitle =
  //   activeTab === 'managed' ? 'Managed Office' : 'Design & Build';
  // const sectionDescription =
  //   activeTab === 'managed'
  //     ? 'All your submitted leads for Managed Office will appear here.'
  //     : 'Leads and submissions for Design & Build.';

  return (
    <PageLayout
      pageTitle="My Submissions"
      pageIcon={<RiStackLine size={24} />}
      pageDescription="All your submitted leads will be displayed here."
      headerActions={
        <div className="flex items-center gap-3">
          {/* <Button.Root variant="neutral" mode="ghost" size="medium" aria-label="Voice">
            <Button.Icon as={RiMicLine} />
          </Button.Root> */}

          <Button.Root
            variant="primary"
            mode="filled"
            size="medium"
            className="rounded-full px-5 flex items-center gap-2"
            onClick={() => navigate('/submit-lead')}
          >
            <span>Submit Lead</span>
            <Button.Icon as={RiArrowRightSLine} />
          </Button.Root>
        </div>
      }
    >
      <div className="pt-4">
        <DashboardStatusTabs
          value={activeTab}
          onValueChange={handleTabChange}
          appliedFilters={appliedFilters}
          onFiltersChange={setAppliedFilters}
          managedCount={submissions.managedCount}
          designCount={submissions.designCount}
        />

        <div className="mt-4">
          

          {submissions.isLoading && (
            <div className="rounded-xl border border-stroke-soft-200 bg-bg-white-0 p-8 text-center text-text-sub-500">
              Loading submissions…
            </div>
          )}

          {!submissions.isLoading && submissions.error && (
            <div className="rounded-xl border border-stroke-soft-200 bg-bg-white-0 p-6 text-error-base">
              {submissions.error}
            </div>
          )}

          {!submissions.isLoading && !submissions.error && submissions.data.length === 0 && (
            <div className="rounded-xl border border-stroke-soft-200 bg-bg-white-0 p-8 text-center text-text-sub-500">
              No submissions found.
            </div>
          )}

          {!submissions.isLoading && !submissions.error && submissions.data.length > 0 && (
            <ul className="flex flex-col gap-4 list-none p-0 m-0">
              {submissions.data.map((item) => (
                <li key={item.id}>
                  <LeadSubmissionCard
                    submission={item}
                    crmStages={externalCrmStages.data}
                    onViewDetails={handleViewDetails}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Dashboard;
