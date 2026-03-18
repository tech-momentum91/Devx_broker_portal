// ============================================================
// Imports
// ============================================================
import {
  format,
  parseISO,
  parse,
  isValid,
  differenceInMinutes,
  isToday,
  startOfDay,
  subDays,
  startOfMonth,
  isBefore,
  isAfter,
} from 'date-fns';

// ============================================================
// Base Timestamp Utilities
// ============================================================

/**
 * Converts a timestamp to DD/MM/YYYY format string
 */
export const formatTimestampToDDMMYYYY = (timestamp) => {
  if (!timestamp || typeof timestamp !== 'number') return '';

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

/**
 * Converts a timestamp to YYYY-MM-DD format string
 */
export const formatTimestampToYYYYMMDD = (timestamp) => {
  if (!timestamp || typeof timestamp !== 'number') return '';

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${year}-${month}-${day}`;
};

/**
 * Parses DD/MM/YYYY format string to timestamp
 */
export const parseDDMMYYYYToTimestamp = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return null;

  const match = dateString.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const [, day, month, year] = match;

  const date = new Date(
    Number.parseInt(year, 10),
    Number.parseInt(month, 10) - 1,
    Number.parseInt(day, 10),
  );

  if (
    date.getDate() !== Number.parseInt(day, 10) ||
    date.getMonth() !== Number.parseInt(month, 10) - 1 ||
    date.getFullYear() !== Number.parseInt(year, 10)
  ) {
    return null;
  }

  return date.getTime();
};

/**
 * Parses YYYY-MM-DD format string to timestamp
 */
export const parseYYYYMMDDToTimestamp = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return null;

  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const [, year, month, day] = match;

  const date = new Date(
    Number.parseInt(year, 10),
    Number.parseInt(month, 10) - 1,
    Number.parseInt(day, 10),
  );

  if (
    date.getDate() !== Number.parseInt(day, 10) ||
    date.getMonth() !== Number.parseInt(month, 10) - 1 ||
    date.getFullYear() !== Number.parseInt(year, 10)
  ) {
    return null;
  }

  return date.getTime();
};

/**
 * YYYY-MM-DD → DD/MM/YYYY
 */
export const convertYYYYMMDDToDDMMYYYY = (dateString) => {
  if (!dateString) return '';

  const timestamp = parseYYYYMMDDToTimestamp(dateString);
  if (!timestamp) return dateString;

  return formatTimestampToDDMMYYYY(timestamp);
};

/**
 * DD/MM/YYYY → YYYY-MM-DD
 */
export const convertDDMMYYYYToYYYYMMDD = (dateString) => {
  if (!dateString) return '';

  const timestamp = parseDDMMYYYYToTimestamp(dateString);
  if (!timestamp) return dateString;

  return formatTimestampToYYYYMMDD(timestamp);
};

/**
 * Validate DD/MM/YYYY
 */
export const isValidDDMMYYYYFormat = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return false;
  return parseDDMMYYYYToTimestamp(dateString) !== null;
};

/**
 * Current timestamp
 */
export const getCurrentTimestamp = () => Date.now();

// ============================================================
// date-fns Utilities
// ============================================================

export const DISPLAY_DATETIME_FORMAT = 'dd-MM-yyyy h:mm a';
export const DISPLAY_DATETIME_FORMAT_2 = 'dd MMM yyyy, h:mm a';

/**
 * Parses ISO, Frappe datetime, timestamps, and Date objects
 */
export const parseToDate = (input) => {
  if (!input) return null;

  if (input instanceof Date && isValid(input)) return input;

  if (typeof input === 'number') {
    const d = new Date(input);
    return isValid(d) ? d : null;
  }

  if (typeof input === 'string') {
    try {
      const iso = parseISO(input);
      if (isValid(iso)) return iso;
    } catch (error) {
      // Ignore parse errors, try next format
      void error;
    }

    try {
      const f1 = parse(input, 'yyyy-MM-dd HH:mm:ss.SSSSSS', new Date());
      if (isValid(f1)) return f1;
    } catch (error) {
      // Ignore parse errors, try next format
      void error;
    }

    try {
      const f2 = parse(input, 'yyyy-MM-dd HH:mm:ss', new Date());
      if (isValid(f2)) return f2;
    } catch (error) {
      // Ignore parse errors, try next format
      void error;
    }

    const native = new Date(input);
    return isValid(native) ? native : null;
  }

  return null;
};

/**
 * Display datetime formatter
 */
export const formatDisplayDateTime = (input) => {
  const date = parseToDate(input);
  if (!date) return '';
  return format(date, DISPLAY_DATETIME_FORMAT_2);
};

/**
 * Formats date as "12th Dec 25" (day with ordinal, month abbreviation, 2-digit year)
 * Accepts timestamp, YYYY-MM-DD string, or Date object
 */
export const formatDateWithOrdinal = (input) => {
  const date = parseToDate(input);
  if (!date) return '';
  return format(date, 'do MMM yy');
};

/** Section keys for inbox grouping by date */
export const INBOX_SECTION_KEYS = {
  TODAY: 'today',
  LAST_7_DAYS: 'last7days',
  EARLIER_THIS_MONTH: 'earlierThisMonth',
};

/** Prefix for dynamic month sections: "month-YYYY-M" e.g. month-2026-2 */
export const INBOX_SECTION_MONTH_PREFIX = 'month-';
/** Prefix for dynamic year sections: "year-YYYY" e.g. year-2025 */
export const INBOX_SECTION_YEAR_PREFIX = 'year-';

/** Month names for section labels */
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Returns the ordered list of inbox section keys and labels for the current date.
 * Order: Today, Last 7 days, Earlier this month, then previous months (e.g. February, January), then previous year (e.g. 2025).
 * @returns {{ key: string, label: string }[]}
 */
export const getInboxSectionOrder = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const sections = [
    { key: INBOX_SECTION_KEYS.TODAY, label: 'Today' },
    { key: INBOX_SECTION_KEYS.LAST_7_DAYS, label: 'Last 7 days' },
    { key: INBOX_SECTION_KEYS.EARLIER_THIS_MONTH, label: 'Earlier this month' },
  ];
  for (let m = currentMonth - 1; m >= 0; m--) {
    const monthKey = `${INBOX_SECTION_MONTH_PREFIX}${currentYear}-${m + 1}`;
    sections.push({ key: monthKey, label: MONTH_NAMES[m] });
  }
  sections.push({
    key: `${INBOX_SECTION_YEAR_PREFIX}${currentYear - 1}`,
    label: String(currentYear - 1),
  });
  return sections;
};

/**
 * Returns the display label for an inbox section key (static or dynamic).
 * @param {string} sectionKey
 * @returns {string}
 */
export const getInboxSectionLabel = (sectionKey) => {
  if (sectionKey === INBOX_SECTION_KEYS.TODAY) return 'Today';
  if (sectionKey === INBOX_SECTION_KEYS.LAST_7_DAYS) return 'Last 7 days';
  if (sectionKey === INBOX_SECTION_KEYS.EARLIER_THIS_MONTH) return 'Earlier this month';
  if (sectionKey.startsWith(INBOX_SECTION_MONTH_PREFIX)) {
    const parts = sectionKey.slice(INBOX_SECTION_MONTH_PREFIX.length).split('-');
    const monthNum = Number(parts[1], 10);
    if (monthNum >= 1 && monthNum <= 12) return MONTH_NAMES[monthNum - 1];
  }
  if (sectionKey.startsWith(INBOX_SECTION_YEAR_PREFIX))
    return sectionKey.slice(INBOX_SECTION_YEAR_PREFIX.length);
  return sectionKey;
};

/**
 * Returns which inbox section a date falls into.
 * @param {string|Date|number} input - createdAt value
 * @returns {string} Section key (today, last7days, earlierThisMonth, month-YYYY-M, or year-YYYY)
 */
export const getInboxSection = (input) => {
  const date = parseToDate(input);
  if (!date) {
    const now = new Date();
    return `${INBOX_SECTION_YEAR_PREFIX}${now.getFullYear() - 1}`;
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const sevenDaysAgoStart = startOfDay(subDays(now, 7));
  const monthStart = startOfMonth(now);
  const dateYear = date.getFullYear();
  const dateMonth = date.getMonth();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  if (isToday(date)) return INBOX_SECTION_KEYS.TODAY;
  if (isBefore(date, todayStart) && !isBefore(date, sevenDaysAgoStart))
    return INBOX_SECTION_KEYS.LAST_7_DAYS;
  if (isBefore(date, sevenDaysAgoStart) && !isBefore(date, monthStart))
    return INBOX_SECTION_KEYS.EARLIER_THIS_MONTH;
  if (dateYear === currentYear && dateMonth < currentMonth)
    return `${INBOX_SECTION_MONTH_PREFIX}${dateYear}-${dateMonth + 1}`;
  return `${INBOX_SECTION_YEAR_PREFIX}${dateYear}`;
};

/**
 * Formats inbox item date/time: today → time only (e.g. "11:52 AM"), else → "17th Feb 2026".
 * @param {string|Date|number} input - createdAt value
 * @returns {string}
 */
export const formatInboxDateTime = (input) => {
  const date = parseToDate(input);
  if (!date) return '';
  if (isToday(date)) return format(date, 'h:mm a');
  return format(date, 'do MMM yy');
};

/**
 * Formats conflict dates for inline hint (e.g. "2nd Jun, 5th Jun and 3 more dates are unavailable.")
 */
export const formatConflictMessage = (conflicts) => {
  if (!conflicts || conflicts.length === 0) return '';
  const total = conflicts.length;
  const shown = conflicts.slice(0, 2).map(formatDateWithOrdinal);
  const remaining = total - shown.length;
  const baseText = shown.join(', ');
  if (remaining > 0) {
    return `${baseText} and ${remaining} more dates are unavailable.`;
  }
  return `${baseText} are unavailable.`;
};

/**
 * Formats a period range as "2nd Jun 25 - 10th Dec 25"
 * Accepts any inputs supported by parseToDate
 */
export const formatPeriod = (startDate, endDate) => {
  if (!startDate || !endDate) return '';

  const start = parseToDate(startDate);
  const end = parseToDate(endDate);

  if (!start || !end) return '';

  const startFormatted = formatDateWithOrdinal(start);
  const endFormatted = formatDateWithOrdinal(end);

  return `${startFormatted} - ${endFormatted}`;
};

/**
 * Formats a time range (e.g., "10:00 - 11:30 AM")
 * Accepts any inputs supported by parseToDate
 */
export const formatTimeRange = (start, end) => {
  if (!start || !end) return '';

  const startDate = parseToDate(start);
  const endDate = parseToDate(end);

  if (!startDate || !endDate) return '';

  const startTime = format(startDate, 'h:mm a');
  const endTime = format(endDate, 'h:mm a');
  return `${startTime} - ${endTime}`;
};

/**
 * Formats a full date & time range for table display
 * Example: "20th Jan 24, 4:00 - 6:00 PM"
 * Accepts any inputs supported by parseToDate
 */
export const formatDateTimeRangeForTable = (start, end) => {
  if (!start || !end) return '-';

  const startDate = parseToDate(start);
  const endDate = parseToDate(end);
  if (!startDate || !endDate) return '-';

  const dateStr = formatDateWithOrdinal(startDate);
  const timeStr = formatTimeRange(start, end);
  return `${dateStr}, ${timeStr}`;
};

/**
 * Formats a date range label in DD/MM/YY - DD/MM/YY format
 * Accepts any inputs supported by parseToDate
 */
export const formatDateRangeLabel = (from, to, placeholder = 'DD/MM/YY - DD/MM/YY') => {
  if (!from || !to) return placeholder;

  const fromDate = parseToDate(from);
  const toDate = parseToDate(to);
  if (!fromDate || !toDate) return placeholder;

  const fromStr = format(fromDate, 'dd/MM/yy');
  const toStr = format(toDate, 'dd/MM/yy');
  return `${fromStr} - ${toStr}`;
};

/**
 * Format month and year for display (e.g., "June 2025")
 * Accepts any inputs supported by parseToDate
 */
export const formatMonthYear = (input) => {
  if (!input) return '';

  const date = parseToDate(input);
  if (!date) return '';

  return format(date, 'MMMM yyyy');
};

/**
 * Safe display formatter
 */
export const safeDisplayDateTime = (input, fallback = '--') => {
  const value = formatDisplayDateTime(input);
  return value || fallback;
};

// ============================================================
// SLA Utilities
// ============================================================

/**
 * SLA response countdown
 */
export const getResponseCountdown = (responseBy) => {
  const responseDate = parseToDate(responseBy);
  if (!responseDate) return null;

  const now = new Date();
  const minutesRemaining = differenceInMinutes(responseDate, now);

  if (minutesRemaining <= 0) {
    return { label: 'breached', isBreached: true, urgency: 'high' };
  }

  const urgency = minutesRemaining <= 60 ? 'high' : 'medium';

  if (minutesRemaining < 60) {
    return {
      label: `in ${minutesRemaining} mins`,
      isBreached: false,
      urgency,
    };
  }

  const hours = Math.ceil(minutesRemaining / 60);
  return {
    label: `in ${hours} hours`,
    isBreached: false,
    urgency,
  };
};

/**
 * SLA first-response duration
 */
export const getFirstResponseDuration = (firstRespondedOn, creation) => {
  const respondedDate = parseToDate(firstRespondedOn);
  if (!respondedDate) return null;

  const creationDate = parseToDate(creation) || respondedDate;
  const totalMinutes = Math.max(0, differenceInMinutes(respondedDate, creationDate));

  if (totalMinutes < 60) {
    const minutes = Math.max(1, totalMinutes);
    const label = minutes === 1 ? 'min' : 'mins';
    return `resolved in ${minutes} ${label}`;
  }

  const hours = Math.max(1, Math.ceil(totalMinutes / 60));
  const hLabel = hours === 1 ? 'hour' : 'hours';
  return `resolved in ${hours} ${hLabel}`;
};

// Time options for dropdowns (12:00 AM - 11:00 PM in hourly intervals)
export const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i % 12 || 12;
  const period = i < 12 ? 'AM' : 'PM';
  return `${hour}:00 ${period}`;
});

/**
 * Format time from API format (HH:mm:ss) to display format (h:mm a)
 * @param {string} timeString - Time in HH:mm:ss format (e.g., \"13:00:00\")
 * @returns {string} Time in display format (e.g., \"1:00 PM\")
 */
export const formatTimeFromAPI = (timeString) => {
  if (!timeString || typeof timeString !== 'string') return '';
  try {
    // Parse time string in HH:mm:ss format
    const parsedTime = parse(timeString, 'HH:mm:ss', new Date());
    if (!parsedTime || Number.isNaN(parsedTime.getTime())) return '';
    // Format to display format (h:mm a) and uppercase
    return format(parsedTime, 'h:mm a').toUpperCase();
  } catch (error) {
    console.error('Error formatting time from API:', error);
    return '';
  }
};

/**
 * Format time from display format (h:mm a) to API format (HH:mm:ss)
 * @param {string} timeString - Time in display format (e.g., \"1:00 PM\")
 * @returns {string} Time in API format (e.g., \"13:00:00\")
 */
export const formatTimeToAPI = (timeString) => {
  if (!timeString || typeof timeString !== 'string') return '';
  try {
    const parsedTime = parse(timeString, 'h:mm a', new Date());
    if (!parsedTime || Number.isNaN(parsedTime.getTime())) return '';
    return format(parsedTime, 'HH:mm:ss');
  } catch (error) {
    console.error('Error formatting time to API:', error);
    return '';
  }
};

/**
 * Validate time format (h:mm a or h:mm AM/PM)
 * @param {string} timeStr - Time string to validate
 * @returns {boolean} True if valid format
 */
export const isValidTimeFormat = (timeStr) => {
  if (!timeStr) return false;
  return /^(1[0-2]|0?[1-9]):[0-5]\d\s+(am|pm)$/i.test(timeStr);
};

/**
 * Compare if end time is after start time
 * @param {string} startTimeStr - Start time in display format
 * @param {string} endTimeStr - End time in display format
 * @returns {boolean} True if end time is after start time
 */
export const isEndTimeAfterStartTime = (startTimeStr, endTimeStr) => {
  if (!startTimeStr || !endTimeStr) return true; // Skip validation if either is empty
  try {
    const start = parse(startTimeStr, 'h:mm a', new Date());
    const end = parse(endTimeStr, 'h:mm a', new Date());
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return true;
    return end > start;
  } catch {
    return true;
  }
};

/**
 * Validate time pair (start and end)
 * @param {string} startTime - Start time string
 * @param {string} endTime - End time string
 * @returns {{isValid: boolean, errors: {start_time?: string, end_time?: string}}}
 */
export const validateTimePair = (startTime, endTime) => {
  const errors = {};
  let isValidTime = true;

  // Validate start time format
  if (startTime && !isValidTimeFormat(startTime)) {
    errors.start_time = 'Invalid time format. Use format: 12:00 AM';
    isValidTime = false;
  }

  // Validate end time format
  if (endTime && !isValidTimeFormat(endTime)) {
    errors.end_time = 'Invalid time format. Use format: 12:00 PM';
    isValidTime = false;
  }

  // Validate time range (end after start)
  if (isValidTime && startTime && endTime && !isEndTimeAfterStartTime(startTime, endTime)) {
    errors.end_time = 'End time must be after start time';
    isValidTime = false;
  }

  return { isValid: isValidTime, errors };
};
