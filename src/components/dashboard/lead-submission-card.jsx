import React from 'react';
import { RiMapPinLine, RiCalendarLine, RiArrowRightUpLine } from 'react-icons/ri';
import * as Avatar from '@/components/ui/avatar';
import * as Button from '@/components/ui/button';
import LeadStatusBadge from './lead-status-badge';
import LeadProgressBar, { getCurrentStageIndex } from './lead-progress-bar';
import MilestoneIndicator from './milestone-indicator';
import { cn } from '@/utils/cn';

const DESIGN_BUILD_SERVICE_TYPES = ['Design & Build', 'Design and Build'];

function isDesignBuild(serviceType) {
  if (!serviceType) return false;
  return DESIGN_BUILD_SERVICE_TYPES.includes(String(serviceType).trim());
}

/**
 * Formats area for display (e.g. 8400 -> "8,400 sq ft").
 */
function formatArea(sqFt) {
  const num = Number(sqFt);
  if (num === 0 || Number.isNaN(num)) return '0 sq ft';
  return `${num.toLocaleString()} sq ft`;
}

/**
 * Single lead submission card (reusable for Managed Office and Design & Build).
 * @param {object} submission - Normalized: { id, companyName, initial, serviceType, city, date, seats, areaSqFt, status, budget?, dealValue? }
 * @param {Array} [crmStages] - CRM stages with apply_to_external true (for lead progress bar)
 * @param {string} [className] - Optional class name for the card root
 * @param {function} [onViewDetails] - Callback when view/details is clicked (id) => {}
 */
const LeadSubmissionCard = ({ submission, crmStages, className, onViewDetails }) => {
  if (!submission) return null;


  
  const {
    id,
    companyName,
    initial,
    serviceType,
    city,
    date,
    seats,
    areaSqFt,
    status,
    budget,
    dealValue,
  } = submission;

  const designBuild = isDesignBuild(serviceType);
  const lifeCycleStageStatus = submission?.life_cycle_stage_status ?? submission?.status ?? '';
  const sortedStages = Array.isArray(crmStages)
    ? [...crmStages].sort((a, b) => (a?.stage_index ?? 0) - (b?.stage_index ?? 0))
    : [];
  const currentStageIdx = sortedStages.length ? getCurrentStageIndex(sortedStages, lifeCycleStageStatus) : -1;
  const currentStage = currentStageIdx >= 0 ? sortedStages[currentStageIdx] : null;
  const stageColor = submission.stage_color ?? currentStage?.color;
  const stageLabel =
    currentStage?.stage ??
    currentStage?.name ??
    ((lifeCycleStageStatus && String(lifeCycleStageStatus).trim()) || status);

  const handleAction = () => {
    onViewDetails?.(id);
  };

  return (
    <div
      className={cn(
        'flex flex-nowrap items-center gap-0 overflow-x-auto rounded-xl border border-stroke-soft-200 bg-bg-weak-100 py-5 pl-5 pr-5 shadow-[var(--shadow-custom-xs)]',
        className,
      )}
    >
      {/* Left: Avatar + Company + meta (same for both) */}
      <div className="flex w-[280px] min-w-[280px] shrink-0 items-center gap-3 pr-5">
        <Avatar.Root
          size={32}
          color="gray"
          className="shrink-0 rounded-full bg-success-lighter text-success-darker"
        >
          <span className="flex size-full items-center justify-center font-semibold">{initial}</span>
        </Avatar.Root>
        <div className="min-w-0 flex-1">
          <p className="truncate text-label-lg font-semibold text-text-main-900">{companyName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-label-xs text-text-sub-500">
            <span className="inline-flex shrink-0 rounded-md bg-success-lighter px-2 py-0.5 font-medium text-success-darker">
              {serviceType}
            </span>
            <span className="flex min-w-0 items-center gap-1 truncate">
              <RiMapPinLine className="size-3.5 shrink-0 text-text-soft-400" />
              <span className="truncate">{city}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1">
              <RiCalendarLine className="size-3.5 shrink-0 text-text-soft-400" />
              <span>{date}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Middle + Right: different details for Design & Build vs Managed Office */}
      <div className="ml-auto flex shrink-0 items-center gap-0">
        <div className="h-10 w-px shrink-0 bg-stroke-soft-200" aria-hidden />

        {designBuild ? (
          <>
            <div className="flex w-[7.5rem] min-w-[7.5rem] shrink-0 flex-col px-5">
              <p className="text-label-xs text-text-sub-500">Area</p>
              <p className="mt-0.5 text-label-sm font-semibold text-text-main-900">
                {formatArea(areaSqFt)}
              </p>
            </div>
            <div className="h-10 w-px shrink-0 bg-stroke-soft-200" aria-hidden />
            <div className="flex w-24 min-w-24 shrink-0 flex-col px-5">
              <p className="text-label-xs text-text-sub-500">Budget</p>
              <p className="mt-0.5 text-label-sm font-semibold text-text-main-900">
                {budget ?? '—'}
              </p>
            </div>
            {dealValue != null && dealValue !== '' && (
              <>
                <div className="h-10 w-px shrink-0 bg-stroke-soft-200" aria-hidden />
                <div className="flex w-24 min-w-24 shrink-0 flex-col px-5">
                  <p className="text-label-xs text-text-sub-500">Deal Value</p>
                  <p className="mt-0.5 text-label-sm font-semibold text-success-darker">
                    {dealValue}
                  </p>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <div className="flex w-24 min-w-24 shrink-0 flex-col px-5">
              <p className="text-label-xs text-text-sub-500">Seats</p>
              <p className="mt-0.5 text-label-sm font-semibold text-text-main-900">{seats}</p>
            </div>
            <div className="h-10 w-px shrink-0 bg-stroke-soft-200" aria-hidden />
            <div className="flex w-[7.5rem] min-w-[7.5rem] shrink-0 flex-col px-5">
              <p className="text-label-xs text-text-sub-500">Area</p>
              <p className="mt-0.5 text-label-sm font-semibold text-text-main-900">
                {formatArea(areaSqFt)}
              </p>
            </div>
          </>
        )}

        <div className="h-10 w-px shrink-0 bg-stroke-soft-200" aria-hidden />

        <div className="flex shrink-0 items-center gap-2 pl-5">
          <LeadStatusBadge
            status={status}
            stageLabel={stageLabel}
            stageColor={stageColor}
          />
          {/* {Array.isArray(crmStages) && crmStages.length > 0 && (
            <div className="hidden sm:block">
              <LeadProgressBar stages={crmStages} lead={submission} />
            </div>
          )} */}
          {designBuild && (
            <div className="hidden sm:block">
              <MilestoneIndicator lead={submission} />
            </div>
          )}
          <Button.Root
            variant="neutral"
            mode="ghost"
            size="small"
            aria-label="View details"
            onClick={handleAction}
            className="shrink-0 rounded-full bg-bg-white-0 p-2 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] hover:bg-bg-soft-200"
          >
            <Button.Icon as={RiArrowRightUpLine} className="size-4 text-text-sub-600" />
          </Button.Root>
        </div>
      </div>
    </div>
  );
};

export default LeadSubmissionCard;
