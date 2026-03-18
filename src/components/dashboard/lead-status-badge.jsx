import React from 'react';
import * as Badge from '@/components/ui/badge';
import { cn } from '@/utils/cn';

/** Maps lead status value to display label */
export const LEAD_STATUS_LABELS = {
  in_discussion: 'In Discussion',
  lead_submitted: 'Lead Submitted',
  in_qualification: 'In Qualification',
  design_won: 'Design Won',
  execution_won: 'Execution Won',
  dropped: 'Dropped',
  won: 'Won',
};

/** Maps lead status to Badge color (filled variant) */
const STATUS_BADGE_CONFIG = {
  in_discussion: { color: 'blue', variant: 'filled' },
  lead_submitted: { color: 'purple', variant: 'filled' },
  in_qualification: { color: 'gray', variant: 'light' },
  design_won: { color: 'green', variant: 'light' },
  execution_won: { color: 'teal', variant: 'light' },
  dropped: { color: 'gray', variant: 'light' },
  won: { color: 'green', variant: 'filled' },
};

/** Returns true if hex color is dark (use white text). */
function isDarkHex(hex) {
  if (!hex || typeof hex !== 'string') return true;
  const h = hex.replace(/^#/, '');
  if (h.length !== 6 && h.length !== 8) return true;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance < 0.5;
}

/**
 * Reusable badge for lead submission status.
 * Shows lifecycle stage name and color when stageLabel + stageColor are provided (from CRM stages).
 * @param {string} status - Display status (e.g. from lead.status or life_cycle_stage_status)
 * @param {string} [stageLabel] - Lifecycle stage display name (e.g. from CRM stage.stage); when set with stageColor, this is shown
 * @param {string} [stageColor] - Optional hex color from CRM stage (DB); when set, badge uses this background
 * @param {string} [className] - Optional class name
 */
const LeadStatusBadge = ({ status, stageLabel, stageColor, className }) => {
  const normalized = status ? String(status).toLowerCase().replace(/\s+/g, '_') : '';
  const config = STATUS_BADGE_CONFIG[normalized] ?? { color: 'gray', variant: 'light' };
  const fallbackLabel = LEAD_STATUS_LABELS[normalized] ?? status ?? '—';
  const label = stageLabel != null && String(stageLabel).trim() !== '' ? String(stageLabel).trim() : fallbackLabel;

  const hex = stageColor && String(stageColor).trim();
  const normalizedHex = hex ? hex.replace(/^#/, '') : '';
  const useCustomColor = normalizedHex && /^[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(normalizedHex);

  if (useCustomColor) {
    const bg = `#${normalizedHex}`;
    const textColor = isDarkHex(bg) ? '#ffffff' : 'rgba(0,0,0,0.85)';
    return (
      <span
        className={cn('inline-flex h-5 items-center gap-1.5 rounded-md px-2 text-label-xs font-medium', className)}
        style={{ backgroundColor: bg, color: textColor }}
      >
        {label}
      </span>
    );
  }

  return (
    <Badge.Root
      size="medium"
      variant={config.variant}
      color={config.color}
      className={cn('rounded-md', className)}
    >
      {label}
    </Badge.Root>
  );
};

export default LeadStatusBadge;
