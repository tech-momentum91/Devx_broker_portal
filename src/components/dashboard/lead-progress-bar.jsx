import React from 'react';
import { cn } from '@/utils/cn';

/**
 * Finds the index of the stage that contains the given lead status.
 * Stages are ordered by stage_index; each stage has crm_stage_status with { status }.
 * @param {Array<{ stage_index?: number, crm_stage_status?: Array<{ status?: string }> }>} stages
 * @param {string} leadStatus
 * @returns {number} 0-based stage index, or -1 if no match
 */
export function getCurrentStageIndex(stages, leadStatus) {
  if (!stages?.length || leadStatus == null || leadStatus === '') return -1;
  const normalized = String(leadStatus).trim().toLowerCase();
  for (let i = 0; i < stages.length; i++) {
    const statuses = stages[i]?.crm_stage_status ?? [];
    const hasMatch = statuses.some(
      (s) => String(s?.status ?? '').trim().toLowerCase() === normalized,
    );
    if (hasMatch) return i;
  }
  // Fallback: match stage name itself (e.g. "Lead" stage for "Lead" status)
  for (let i = 0; i < stages.length; i++) {
    const stageName = String(stages[i]?.stage ?? '').trim().toLowerCase();
    if (stageName === normalized) return i;
  }
  return -1;
}

/**
 * Lead progress bar showing CRM stages where apply_to_external is true.
 * Stages are fetched via get_crm_stages and filtered by apply_to_external; lead status
 * (from lead data) is matched against each stage's crm_stage_status to show progress.
 * @param {{ stages: Array<{ stage?: string, stage_index?: number, color?: string, crm_stage_status?: Array<{ status?: string }> }>, lead: { status?: string, life_cycle_stage_status?: string }, className?: string }} props
 */
const LeadProgressBar = ({ stages, lead, className }) => {
  const list = Array.isArray(stages) ? stages : [];
  const sorted = [...list].sort(
    (a, b) => (a?.stage_index ?? 0) - (b?.stage_index ?? 0),
  );
  // Prefer life_cycle_stage_status (CRM Lead) for stage matching; fallback to status
  const leadStatus =
    lead?.life_cycle_stage_status ?? lead?.status ?? '';
  const currentIndex = getCurrentStageIndex(sorted, leadStatus);
  const total = sorted.length;
  const completedCount = currentIndex < 0 ? 0 : currentIndex + 1;
  const progressPercent = total > 0 ? (completedCount / total) * 100 : 0;

  if (total === 0) return null;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-text-sub-500">Lead progress</span>
        <span className="text-[11px] text-text-soft-400">
          {completedCount}/{total}
        </span>
      </div>
      <div
        className="h-1.5 w-full max-w-[120px] rounded-full bg-gray-100 overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(progressPercent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Lead progress: ${completedCount} of ${total} stages`}
      >
        <div
          className="h-full rounded-full bg-primary-base transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-x-1.5 gap-y-0.5">
        {sorted.slice(0, 6).map((stage, i) => {
          const isReached = i <= currentIndex;
          return (
            <span
              key={stage?.name ?? i}
              className={cn(
                'text-[10px] truncate max-w-[52px]',
                isReached ? 'text-text-sub-600 font-medium' : 'text-text-soft-400',
              )}
              title={stage?.stage}
            >
              {stage?.stage ?? `S${i + 1}`}
            </span>
          );
        })}
        {sorted.length > 6 && (
          <span className="text-[10px] text-text-soft-400">+{sorted.length - 6}</span>
        )}
      </div>
    </div>
  );
};

export default LeadProgressBar;
