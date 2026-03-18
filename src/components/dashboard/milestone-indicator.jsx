import React from 'react';
import { RiCheckLine, RiCheckboxBlankCircleLine } from 'react-icons/ri';

const MILESTONE_KEYS = [
  'milestoneMeetingDone',
  'milestoneRequirementsReceived',
  'milestoneLOISigned',
];

/**
 * Compact engagement/milestone indicator for Design & Build cards.
 * Shows 3 steps (Physical Meeting, Requirements, LOI) and an orange progress bar.
 * @param {{ lead: object }} props - lead may have milestoneMeetingDone, milestoneRequirementsReceived, milestoneLOISigned
 */
const MilestoneIndicator = ({ lead }) => {
  const completed = MILESTONE_KEYS.filter((key) => lead?.[key]).length;
  const total = MILESTONE_KEYS.length;

  return (
    <div className="flex flex-col items-end gap-1.5">
      <span className="text-[11px] font-medium text-purple-500">Engagement</span>
      <div className="flex items-center gap-1.5">
        {MILESTONE_KEYS.map((key) =>
          lead?.[key] ? (
            <RiCheckLine key={key} className="h-3.5 w-3.5 text-green-500 shrink-0" />
          ) : (
            <RiCheckboxBlankCircleLine
              key={key}
              className="h-3.5 w-3.5 text-gray-300 shrink-0"
            />
          ),
        )}
        <span className="text-[11px] text-gray-400 ml-0.5">
          {completed}/{total}
        </span>
      </div>
      <div className="h-1 w-full max-w-[80px] rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-orange-400 transition-all"
          style={{ width: `${total ? (completed / total) * 100 : 0}%` }}
        />
      </div>
    </div>
  );
};

export default MilestoneIndicator;
