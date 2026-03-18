import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  RiArrowLeftSLine,
  RiStackLine,
  RiUser3Line,
  RiPhoneLine,
  RiMailLine,
  RiMapPinLine,
  RiCalendarLine,
  RiTeamLine,
  RiLayout2Line,
  RiBriefcase4Line,
  RiMoneyRupeeCircleLine,
  RiShareForwardLine,
  RiErrorWarningLine,
  RiGiftLine,
  RiCheckLine,
  RiCheckboxBlankCircleLine,
  RiLineChartLine,
} from 'react-icons/ri';

import PageLayout from '@/components/page-layout';
import LeadStatusBadge from '@/components/dashboard/lead-status-badge';
import LeadProgressBar, { getCurrentStageIndex } from '@/components/dashboard/lead-progress-bar';
import { getLeadById, getCrmStagesForExternal } from '@/services/dashboard-service';

const STATUS_STEP_INDEX = {
  lead_submitted: 1,
  lead: 1,
  in_discussion: 2,
  won: 3,
};

const TERMINAL_STATUSES = new Set(['lost', 'closed', 'rejected', 'dropped']);

const isTerminalStatus = (rawStatus) => {
  if (!rawStatus) return false;
  const normalized = String(rawStatus).toLowerCase();
  return TERMINAL_STATUSES.has(normalized);
};

const isDroppedStatus = (rawStatus) => {
  if (!rawStatus) return false;
  return String(rawStatus).toLowerCase() === 'dropped';
};

const LossCard = ({ reason }) => (
  <div className="rounded-2xl border border-error-soft-100 bg-error-soft-25 p-6">
    <div className="mb-3 flex items-center gap-2">
      <RiErrorWarningLine className="size-4 text-error-base" />
      <h3 className="text-label-sm font-semibold text-error-base">Drop Reason</h3>
    </div>
    <p className="text-paragraph-sm text-error-dark leading-relaxed">{reason}</p>
  </div>
);

const MILESTONES = [
  { label: 'Physical Meeting Done', key: 'milestoneMeetingDone' },
  { label: 'Client Requirements Received', key: 'milestoneRequirementsReceived' },
  { label: 'LOI / Signing Done', key: 'milestoneLOISigned' },
];

const DEVX_PIPELINE = [
  'Submitted',
  'Under Review',
  'Qualified',
  'Meeting Done',
  'Requirements Received',
  'Sign-off Complete',
  'Engagement',
  'Design Won',
  'Execution Won',
];

const DEVX_COMMISSION_STATUSES = ['Design Won', 'Execution Won'];

function MilestoneBonusCard({ lead }) {
  const completed = MILESTONES.filter((m) => lead[m.key]).length;
  const total = MILESTONES.length;
  const allDone = completed === total;

  return (
    <div className="rounded-xl border border-stroke-soft-200 bg-bg-white-0 p-6 shadow-[var(--shadow-custom-xs)]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-xl bg-amber-50">
            <RiGiftLine className="size-4 text-amber-500" />
          </div>
          <h3 className="text-label-sm font-semibold text-text-main-900">
            Submission Milestone Bonus
          </h3>
        </div>
        {allDone ? (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-label-xs font-semibold text-amber-700">
            ₹10,000 Earned
          </span>
        ) : (
          <span className="text-label-xs font-semibold text-text-sub-500">
            {completed}/{total} Complete
          </span>
        )}
      </div>

      <div className="mb-5 h-1.5 w-full rounded-full bg-bg-soft-200">
        <div
          className="h-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all"
          style={{ width: `${(completed / total) * 100}%` }}
        />
      </div>

      <div className="space-y-2.5">
        {MILESTONES.map((m) => {
          const done = lead[m.key];
          return (
            <div key={m.key} className="flex items-center gap-2.5">
              {done ? (
                <RiCheckLine className="size-4 shrink-0 text-success-base" />
              ) : (
                <RiCheckboxBlankCircleLine className="size-4 shrink-0 text-stroke-soft-200" />
              )}
              <span
                className={`text-paragraph-sm font-medium ${done ? 'text-text-main-900' : 'text-text-sub-500'}`}
              >
                {m.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-stroke-soft-100 pt-4">
        <span className="text-label-xs text-text-sub-500">Bonus (all 3 required)</span>
        <span
          className={`text-paragraph-base font-semibold ${allDone ? 'text-amber-600' : 'text-text-soft-400'}`}
        >
          ₹10,000
        </span>
      </div>

      {!allDone && (
        <p className="mt-2 text-center text-label-xs text-text-sub-500">
          Complete all 3 milestones to unlock the full ₹10,000 bonus.
        </p>
      )}
    </div>
  );
}

function EarningsPotentialCard({ lead }) {
  const idx = DEVX_PIPELINE.indexOf(lead.status);
  const progress = idx >= 0 ? Math.round(((idx + 1) / DEVX_PIPELINE.length) * 100) : 0;
  const isExecutionWon = lead.status === 'Execution Won';
  const isDesignWon = lead.status === 'Design Won';
  const dealValue = lead.dealValue ?? '—';
  const commissionRange = lead.commissionRange ?? '—';

  return (
    <div className="rounded-xl border border-stroke-soft-200 bg-bg-white-0 p-6 shadow-[var(--shadow-custom-xs)]">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-xl bg-success-lighter">
          <RiLineChartLine className="size-4 text-success-darker" />
        </div>
        <h3 className="text-label-sm font-semibold text-text-main-900">Earnings Potential</h3>
      </div>
      <div className="mb-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-paragraph-sm font-medium text-text-sub-500">Deal Value</span>
          <span className="text-paragraph-sm font-semibold text-text-main-900">{dealValue}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-paragraph-sm font-medium text-text-sub-500">
            Est. Commission Range
          </span>
          <span className="text-paragraph-sm font-semibold text-success-darker">
            {commissionRange}
          </span>
        </div>
      </div>
      <div className="mb-3">
        <div className="mb-1.5 flex justify-between">
          <span className="text-label-xs font-medium text-text-sub-500">Pipeline Progress</span>
          <span className="text-label-xs font-semibold text-text-main-900">{progress}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-bg-soft-200">
          <div
            className="h-1.5 rounded-full bg-gradient-to-r from-success-base to-success-dark transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div
        className={`mt-4 rounded-lg border-t border-stroke-soft-100 px-3 py-2 pt-3 text-center text-paragraph-sm font-semibold ${
          isExecutionWon
            ? 'bg-success-lighter text-success-darker'
            : isDesignWon
              ? 'bg-success-lighter text-success-base'
              : 'bg-warning-lighter text-warning-dark'
        }`}
      >
        {isExecutionWon
          ? 'Commission Confirmed'
          : isDesignWon
            ? 'Commission Eligible'
            : 'Commission unlocks after Design Won.'}
      </div>
    </div>
  );
}

function DealWonCard({ lead }) {
  const budget =
    lead.estimatedBudget ??
    (lead.totalDnbBudget != null
      ? `₹${Number(lead.totalDnbBudget).toLocaleString('en-IN')}`
      : null) ??
    '—';
  const subtitle = `${lead.serviceType ?? '—'} · ${lead.seats ?? 0} seats`;

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-success-base to-success-dark p-6">
      <div className="absolute right-0 top-0 size-32 translate-x-1/3 -translate-y-1/3 rounded-full bg-static-white/5" />
      <div className="relative">
        <div className="mb-3 flex items-center gap-2">
          <RiLineChartLine className="size-4 text-static-white/70" />
          <p className="text-label-xs font-semibold uppercase tracking-widest text-static-white/70">
            Deal Won
          </p>
        </div>
        <p className="text-title-h4 font-semibold leading-none tracking-tight text-static-white">
          {budget}
        </p>
        <p className="mt-2 text-label-xs text-static-white/50">{subtitle}</p>
      </div>
    </div>
  );
}

function CommissionCard({ lead }) {
  const isExecutionWon = lead.status === 'Execution Won';

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-success-base to-success-dark p-6">
      <div className="absolute right-0 top-0 size-32 translate-x-1/3 -translate-y-1/3 rounded-full bg-static-white/5" />
      <div className="relative">
        <div className="mb-4 flex items-center gap-2">
          <RiMoneyRupeeCircleLine className="size-4 text-amber-200" />
          <p className="text-label-xs font-semibold uppercase tracking-widest text-static-white/70">
            Commission
          </p>
        </div>
        <p className="text-title-h4 font-semibold leading-none tracking-tight text-static-white">
          {lead.commissionRange ?? '—'}
        </p>
        <p className="mt-2 text-label-xs text-static-white/50">
          {isExecutionWon
            ? 'Confirmed · Ready for payout'
            : 'Eligible · Pending disbursement'}
        </p>
        <div className="mt-4 border-t border-static-white/10 pt-4">
          <p className="text-label-xs text-static-white/40">
            Commission applies to DevX submissions only.
          </p>
        </div>
      </div>
    </div>
  );
}

const SAMPLE_CONVERSATION = [
  {
    from: 'Partner',
    text: 'Client wants to close before quarter end and is keen on the shortlisted options.',
    time: 'Feb 21 · 4:12 PM',
  },
  {
    from: 'Team',
    text: 'Shared availability for site visits this week. Awaiting final confirmation from client side.',
    time: 'Feb 21 · 5:45 PM',
  },
  {
    from: 'Partner',
    text: 'Confirmed. Their leadership team will join the next discussion.',
    time: 'Feb 22 · 9:30 AM',
  },
];

const LeadDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [note, setNote] = useState('');
  const [crmStages, setCrmStages] = useState([]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([getLeadById(id), getCrmStagesForExternal()])
      .then(([data, stages]) => {
        if (!cancelled) {
          setDetail(data);
          setCrmStages(Array.isArray(stages) ? stages : []);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setDetail(null);
          setCrmStages([]);
          setError(err?.message ?? 'Failed to load lead');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const rawStatus = detail?.status ?? '';
  const normalizedStatus = String(rawStatus).toLowerCase().replace(/\s+/g, '_');
  const statusKey =
    normalizedStatus === 'lead' ? 'lead_submitted' : (normalizedStatus || 'lead_submitted');
  const isTerminal = isTerminalStatus(detail?.status);
  const isDropped = isDroppedStatus(detail?.status);
  const dropReason = detail?.dropReason ?? detail?.lossReason ?? null;
  const activeStep = STATUS_STEP_INDEX[statusKey] ?? 1;
  const isDesignBuild = detail?.serviceType === 'Design & Build';
  const showCommission =
    isDesignBuild && DEVX_COMMISSION_STATUSES.includes(detail?.status);
  const isWon = normalizedStatus === 'won';

  if (loading) {
    return (
      <PageLayout pageTitle="Lead Details" pageDescription="View details for this lead.">
        <div className="pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-1 text-paragraph-sm text-text-sub-500 hover:text-text-main-900"
          >
            <RiArrowLeftSLine className="size-4" />
            <span>Back to submissions</span>
          </button>
          <div className="rounded-xl border border-stroke-soft-200 bg-bg-white-0 p-8 text-center text-text-sub-500">
            Loading…
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error || !detail) {
    return (
      <PageLayout pageTitle="Lead Details" pageDescription="View details for this lead.">
        <div className="pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-1 text-paragraph-sm text-text-sub-500 hover:text-text-main-900"
          >
            <RiArrowLeftSLine className="size-4" />
            <span>Back to submissions</span>
          </button>
          <div className="rounded-xl border border-stroke-soft-200 bg-bg-white-0 p-8 text-center">
            {error ? (
              <p className="text-error-base">{error}</p>
            ) : (
              <p className="text-text-sub-500">Lead not found.</p>
            )}
          </div>
        </div>
      </PageLayout>
    );
  }

  const {
    companyName,
    serviceType,
    city,
    contactPerson,
    email,
    phone,
    submittedDate,
    lastUpdated,
    seats,
    areaSqFt,
    requirementType,
    estimatedBudget,
    source,
    timeline,
    requirementSummary,
    status,
  } = detail;

  const displayBudget =
    estimatedBudget ??
    (detail.totalDnbBudget != null
      ? `₹${Number(detail.totalDnbBudget).toLocaleString('en-IN')}`
      : null);

  const sortedStages =
    crmStages.length > 0
      ? [...crmStages].sort(
          (a, b) => (a?.stage_index ?? 0) - (b?.stage_index ?? 0),
        )
      : [];
  const leadStatusForStepper =
    detail?.life_cycle_stage_status ?? detail?.status ?? '';
  const currentStepIndex =
    sortedStages.length > 0
      ? getCurrentStageIndex(sortedStages, leadStatusForStepper)
      : -1;

  return (
    <PageLayout>
      <div className="pt-4 flex flex-col gap-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-paragraph-sm text-text-sub-500 hover:text-text-main-900"
        >
          <RiArrowLeftSLine className="size-4" />
          <span>Back to submissions</span>
        </button>

        <div className="flex items-start gap-3">
          <div
            className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-success-lighter text-success-darker"
            aria-hidden
          >
            <RiStackLine className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-title-h5 text-text-main-900">{companyName}</h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-paragraph-sm">
              <span className="font-medium text-success-darker">{serviceType}</span>
              <span className="text-text-sub-500">{city}</span>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-3">
            <LeadStatusBadge
              status={detail.life_cycle_stage_status ?? detail.lifecycle_stage ?? status}
              stageColor={detail.stage_color}
            />
          </div>
        </div>

        {isTerminal ? (
          <div className="rounded-xl border border-stroke-soft-200 bg-bg-white-0 px-6 py-5 shadow-[var(--shadow-custom-xs)] flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-error-soft-50 text-error-base">
              <RiErrorWarningLine className="size-5" />
            </div>
            <div>
              <p className="text-paragraph-sm font-semibold text-error-base">
                This lead has been closed.
              </p>
              <p className="text-label-xs text-text-sub-500 mt-0.5">
                Status: <span className="font-semibold text-text-main-900">{detail.status}</span>. No further action
                required.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-stroke-soft-200 bg-bg-white-0 px-6 py-6 shadow-[var(--shadow-custom-xs)]">
            <div className="flex items-center">
              {(sortedStages.length > 0
                ? sortedStages.map((stage, i) => {
                    const isReached = i <= currentStepIndex;
                    const isCompleted = i < currentStepIndex;
                    const stepLabel =
                      stage?.stage ?? stage?.name ?? `Step ${i + 1}`;
                    return (
                      <React.Fragment key={stage?.name ?? stage?.stage ?? i}>
                        <div className="flex flex-1 flex-col items-center gap-2">
                          <div
                            className={[
                              'flex size-9 shrink-0 items-center justify-center rounded-full text-label-sm font-semibold',
                              isReached
                                ? 'bg-success-base text-static-white'
                                : 'bg-bg-soft-200 text-text-sub-500',
                            ].join(' ')}
                          >
                            {isCompleted ? (
                              <span className="text-sm leading-none">✓</span>
                            ) : (
                              i + 1
                            )}
                          </div>
                          <span
                            className="text-paragraph-sm text-text-main-900 text-center truncate max-w-[80px]"
                            title={stepLabel}
                          >
                            {stepLabel}
                          </span>
                        </div>
                        {i < sortedStages.length - 1 && (
                          <div
                            className={[
                              'h-0.5 flex-[2] min-w-8 rounded',
                              isCompleted
                                ? 'bg-success-base'
                                : 'bg-stroke-soft-200',
                            ].join(' ')}
                            aria-hidden
                          />
                        )}
                      </React.Fragment>
                    );
                  })
                : [1, 2, 3].map((step) => {
                    const isActive = step === activeStep;
                    const isCompleted = step < activeStep;
                    const stepLabel =
                      step === 1 ? 'Lead Submitted' : step === 2 ? 'In Discussion' : 'Won';
                    return (
                      <React.Fragment key={step}>
                        <div className="flex flex-1 flex-col items-center gap-2">
                          <div
                            className={[
                              'flex size-9 shrink-0 items-center justify-center rounded-full text-label-sm font-semibold',
                              isCompleted || isActive
                                ? 'bg-success-base text-static-white'
                                : 'bg-bg-soft-200 text-text-sub-500',
                            ].join(' ')}
                          >
                            {isCompleted ? (
                              <span className="text-sm leading-none">✓</span>
                            ) : (
                              step
                            )}
                          </div>
                          <span className="text-paragraph-sm text-text-main-900 text-center">
                            {stepLabel}
                          </span>
                        </div>
                        {step !== 3 && (
                          <div
                            className={[
                              'h-0.5 flex-[2] min-w-8 rounded',
                              isCompleted ? 'bg-success-base' : 'bg-stroke-soft-200',
                            ].join(' ')}
                            aria-hidden
                          />
                        )}
                      </React.Fragment>
                    );
                  })
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-stroke-soft-200 bg-bg-white-0 p-6 shadow-[var(--shadow-custom-xs)]">
              <h2 className="text-label-lg font-bold text-text-main-900">Lead Details</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 text-paragraph-sm">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-8 items-center justify-center rounded-full bg-bg-soft-200 text-text-soft-400">
                    <RiUser3Line className="size-4" />
                  </div>
                  <div>
                    <p className="text-[11.5px] font-medium text-gray-400">Contact Person</p>
                    <p className="text-text-main-900">{contactPerson}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-8 items-center justify-center rounded-full bg-bg-soft-200 text-text-soft-400">
                    <RiPhoneLine className="size-4" />
                  </div>
                  <div>
                    <p className="text-[11.5px] font-medium text-gray-400">Phone</p>
                    <p className="text-text-main-900">{phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-8 items-center justify-center rounded-full bg-bg-soft-200 text-text-soft-400">
                    <RiMailLine className="size-4" />
                  </div>
                  <div>
                    <p className="text-[11.5px] font-medium text-gray-400">Email</p>
                    <p className="text-text-main-900">{email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-8 items-center justify-center rounded-full bg-bg-soft-200 text-text-soft-400">
                    <RiMapPinLine className="size-4" />
                  </div>
                  <div>
                    <p className="text-[11.5px] font-medium text-gray-400">City</p>
                    <p className="text-text-main-900">{city}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-8 items-center justify-center rounded-full bg-bg-soft-200 text-text-soft-400">
                    <RiCalendarLine className="size-4" />
                  </div>
                  <div>
                    <p className="text-[11.5px] font-medium text-gray-400">Submitted</p>
                    <p className="text-text-main-900">{submittedDate}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-8 items-center justify-center rounded-full bg-bg-soft-200 text-text-soft-400">
                    <RiCalendarLine className="size-4" />
                  </div>
                  <div>
                    <p className="text-[11.5px] font-medium text-gray-400">Last Updated</p>
                    <p className="text-text-main-900">{lastUpdated}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-stroke-soft-100">
                <p className="text-[11.5px] font-medium text-gray-400">Requirement Summary</p>
                <p className="mt-1 text-paragraph-sm text-text-main-900">
                  {requirementSummary}
                </p>
              </div>
            </div>

            {isDropped && dropReason && (
              <LossCard reason={dropReason} />
            )}

            <div className="rounded-xl border border-stroke-soft-200 bg-bg-white-0 p-6 shadow-[var(--shadow-custom-xs)]">
              <h2 className="text-label-lg font-semibold text-text-main-900">Conversation</h2>
              <div className="mt-4 space-y-4">
                {SAMPLE_CONVERSATION.map((msg, index) => {
                  const isPartner = msg.from === 'Partner';
                  return (
                    <div
                      key={index}
                      className={[
                        'flex gap-3',
                        isPartner ? 'flex-row-reverse' : '',
                      ].join(' ')}
                    >
                      <div
                        className={[
                          'flex size-7 shrink-0 items-center justify-center rounded-full text-label-xs font-semibold',
                          isPartner
                            ? 'bg-success-soft-100 text-success-darker'
                            : 'bg-bg-soft-200 text-text-sub-500',
                        ].join(' ')}
                      >
                        {msg.from.charAt(0)}
                      </div>
                      <div
                        className={[
                          'flex max-w-[75%] flex-col gap-1',
                          isPartner ? 'items-end' : 'items-start',
                        ].join(' ')}
                      >
                        <div
                          className={[
                            'rounded-2xl px-4 py-3 text-paragraph-sm leading-relaxed',
                            isPartner
                              ? 'rounded-tr-sm bg-success-soft-50 text-success-darker'
                              : 'rounded-tl-sm bg-bg-soft-100 text-text-main-900',
                          ].join(' ')}
                        >
                          {msg.text}
                        </div>
                        <span className="px-1 text-label-xs text-text-soft-400">
                          {msg.time}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 flex gap-3 border-t border-stroke-soft-100 pt-4">
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note or update…"
                  className="flex-1 rounded-lg border border-stroke-soft-200 bg-bg-soft-100 px-3 py-2 text-paragraph-sm text-text-main-900 outline-none focus:border-success-soft-400 focus:ring-1 focus:ring-success-soft-300 placeholder:text-text-soft-400"
                />
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg bg-success-base px-4 py-2 text-label-sm font-semibold text-static-white hover:bg-success-dark focus:outline-none focus:ring-2 focus:ring-success-soft-300"
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            {isWon && <DealWonCard lead={detail} />}
            {isDesignBuild && <MilestoneBonusCard lead={detail} />}
            {isDesignBuild && !isTerminal && <EarningsPotentialCard lead={detail} />}
            {showCommission && <CommissionCard lead={detail} />}

            <div className="rounded-xl border border-stroke-soft-200 bg-bg-white-0 p-6 shadow-[var(--shadow-custom-xs)]">
              <h2 className="text-label-lg font-bold text-text-main-900">Project Specs</h2>
              <dl className="mt-4 space-y-3 text-paragraph-sm">
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-2">
                    <RiTeamLine className="size-4 text-text-soft-400" />
                    <dt className="text-[11.5px] font-medium text-gray-400">Seats</dt>
                  </div>
                  <dd className="text-text-main-900">{seats} seats</dd>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-2">
                    <RiLayout2Line className="size-4 text-text-soft-400" />
                    <dt className="text-[11.5px] font-medium text-gray-400">Area</dt>
                  </div>
                  <dd className="text-text-main-900">
                    {Number(areaSqFt).toLocaleString()} sq ft
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-2">
                    <RiBriefcase4Line className="size-4 text-text-soft-400" />
                    <dt className="text-[11.5px] font-medium text-gray-400">Requirement Type</dt>
                  </div>
                  <dd className="text-text-main-900">{requirementType}</dd>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-2">
                    <RiMoneyRupeeCircleLine className="size-4 text-text-soft-400" />
                    <dt className="text-[11.5px] font-medium text-gray-400">Est. Budget</dt>
                  </div>
                  <dd className="text-text-main-900">
                    {displayBudget ?? '—'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-2">
                    <RiShareForwardLine className="size-4 text-text-soft-400" />
                    <dt className="text-[11.5px] font-medium text-gray-400">Source</dt>
                  </div>
                  <dd className="text-text-main-900">{source}</dd>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-2">
                    <RiCalendarLine className="size-4 text-text-soft-400" />
                    <dt className="text-[11.5px] font-medium text-gray-400">Timeline</dt>
                  </div>
                  <dd className="text-text-main-900">{timeline}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default LeadDetailPage;
