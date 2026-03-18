import React, { useState, useCallback } from 'react';
import PageLayout from '@/components/page-layout';
import ManagedOfficeLeadForm from '@/components/submit-lead/managed-office-lead-form';
import DesignBuildLeadForm from '@/components/submit-lead/design-build-lead-form';
import { RiAddLine, RiBuilding4Line, RiStackLine } from 'react-icons/ri';

const SUBMIT_LEAD_TAB_OPTIONS = [
  {
    value: 'managed',
    label: 'Managed Office',
    description: 'Coworking or managed workspace for your client.',
    icon: RiBuilding4Line,
  },
  {
    value: 'design',
    label: 'Design & Build',
    description: "Interior design and fit-out for a client's office space.",
    icon: RiStackLine,
  },
];

const SubmitLeadPage = () => {
  const [activeTab, setActiveTab] = useState('managed');

  const handleTabChange = useCallback((value) => {
    setActiveTab(value);
  }, []);

  return (
    <PageLayout
      pageTitle="Submit New Lead"
      pageIcon={<RiAddLine size={24} />}
      pageDescription="Select the service type and fill in the relevant details."
    >
      <div className="pt-4">
        <div className="mb-4">
          <div className="text-label-xs tracking-widest text-text-soft-400">
            SELECT SERVICE TYPE
          </div>
          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            {SUBMIT_LEAD_TAB_OPTIONS.map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => handleTabChange(tab.value)}
                  className={[
                    'group w-full rounded-2xl border bg-bg-white-0 p-6 text-left transition-colors',
                    selected
                      ? 'border-success-base bg-success-lighter/20'
                      : 'border-stroke-soft-200 hover:bg-bg-weak-50',
                  ].join(' ')}
                  aria-pressed={selected}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={[
                        'flex size-10 items-center justify-center rounded-xl',
                        selected ? 'bg-success-base/15' : 'bg-bg-weak-100',
                      ].join(' ')}
                      aria-hidden
                    >
                      <Icon className="size-5 text-text-strong-950" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-label-md font-semibold text-text-strong-950">
                        {tab.label}
                      </div>
                      <div className="mt-1 text-paragraph-sm text-text-sub-600">
                        {tab.description}
                      </div>
                      {selected ? (
                        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-success-base/10 px-3 py-1 text-paragraph-xs font-medium text-success-darker">
                          <span className="text-success-base">✓</span>
                          Selected
                        </div>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4">
          {!activeTab && (
            <div className="rounded-xl border border-stroke-soft-200 bg-bg-white-0 p-8 text-center text-text-sub-500">
              Select a service type above to continue.
            </div>
          )}
          {activeTab === 'managed' && (
            <ManagedOfficeLeadForm />
          )}
          {activeTab === 'design' && (
            <DesignBuildLeadForm />
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default SubmitLeadPage;
