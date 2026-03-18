import React from 'react';
import {
  RiFileTextLine,
  RiPulseLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiBuilding4Line,
  RiStackLine,
  RiStarLine,
  RiFlashlightLine,
  RiGiftLine,
  RiLineChartLine,
} from 'react-icons/ri';
import { cn } from '@/utils/cn';

const SummaryCard = ({ title, value, description, icon: Icon, descriptionClassName }) => (
  <div className='rounded-2xl border border-stroke-soft-200 bg-bg-white-0 p-5 shadow-[var(--shadow-custom-xs)]'>
    <div className='flex items-start justify-between gap-2'>
      <span className='text-label-sm font-medium text-text-sub-600'>{title}</span>
      {Icon && <Icon className='size-5 shrink-0 text-text-soft-400' aria-hidden />}
    </div>
    <p className='mt-2 text-title-h4 font-semibold text-text-main-900'>{value}</p>
    {description && (
      <p className={cn('mt-1 text-paragraph-xs', descriptionClassName)}>{description}</p>
    )}
  </div>
);

const SectionHeader = ({ title, icon: Icon }) => (
  <div className='mb-4 flex items-center gap-2'>
    {Icon && <Icon className='size-5 text-success-base' aria-hidden />}
    <h3 className='text-label-lg font-semibold text-text-main-900'>{title}</h3>
  </div>
);

const DEFAULT_MANAGED = {
  totalSubmissions: 28,
  active: 9,
  won: 7,
  droppedRejected: 12,
};

const DEFAULT_DESIGN_BUILD = {
  phiTotal: 20,
  active: 5,
  designWon: 6,
  executionWon: 7,
  milestoneBonusEarned: '₹30,000',
  commissionEligibleDeals: 4,
};

const DashboardSummaryCards = ({ summary, isLoading, className }) => {
  const counts = summary?.counts ?? {};
  const managed = {
    ...DEFAULT_MANAGED,
    ...(counts.managed ?? {}),
  };
  const designBuild = {
    ...DEFAULT_DESIGN_BUILD,
    ...(counts.designBuild ?? {}),
  };

  if (isLoading) {
    return (
      <section className={cn('mt-8', className)}>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className='h-32 animate-pulse rounded-2xl border border-stroke-soft-200 bg-bg-weak-50'
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={cn('mt-8 space-y-8', className)}>
      {/* Managed Office */}
      <div>
        <SectionHeader title='Managed Office' icon={RiBuilding4Line} />
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <SummaryCard
            title='Total Submissions'
            value={managed.totalSubmissions}
            description='All DevX leads'
            icon={RiFileTextLine}
            descriptionClassName='text-text-sub-500'
          />
          <SummaryCard
            title='Active'
            value={managed.active}
            description='Submitted + In Discussion'
            icon={RiPulseLine}
            descriptionClassName='text-information-base'
          />
          <SummaryCard
            title='Won'
            value={managed.won}
            description='Closed deals'
            icon={RiCheckboxCircleLine}
            descriptionClassName='text-success-base'
          />
          <SummaryCard
            title='Dropped / Rejected'
            value={managed.droppedRejected}
            description='No longer pursuing'
            icon={RiCloseCircleLine}
            descriptionClassName='text-error-base'
          />
        </div>
      </div>

      {/* Design & Build */}
      <div>
        <SectionHeader title='Design & Build' icon={RiStackLine} />
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          <SummaryCard
            title='Phi Total'
            value={designBuild.phiTotal}
            description='All submissions'
            icon={RiFileTextLine}
            descriptionClassName='text-text-sub-500'
          />
          <SummaryCard
            title='Active'
            value={designBuild.active}
            description='Qualified + Engagement'
            icon={RiPulseLine}
            descriptionClassName='text-information-base'
          />
          <SummaryCard
            title='Design Won'
            value={designBuild.designWon}
            description='Phi Designs'
            icon={RiStarLine}
            descriptionClassName='text-success-base'
          />
          <SummaryCard
            title='Execution Won'
            value={designBuild.executionWon}
            description='Phi Designs'
            icon={RiFlashlightLine}
            descriptionClassName='text-success-base'
          />
          <SummaryCard
            title='Milestone Bonus Earned'
            value={designBuild.milestoneBonusEarned}
            description='This quarter'
            icon={RiGiftLine}
            descriptionClassName='text-warning-base'
          />
          <SummaryCard
            title='Commission Eligible Deals'
            value={designBuild.commissionEligibleDeals}
            description='Design Won+'
            icon={RiLineChartLine}
            descriptionClassName='text-success-base'
          />
        </div>
      </div>
    </section>
  );
};

export default DashboardSummaryCards;
