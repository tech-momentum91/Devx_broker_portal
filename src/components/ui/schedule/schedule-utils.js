/**
 * Calendar Utility Functions
 * Pure utility functions for time formatting, calculations, and date manipulation
 * No business logic, fully reusable across any calendar implementation
 */

// ============================================================================
// TIME FORMATTING
// ============================================================================

/**
 * Format an hour label for the time axis
 * @param {number} hour - Hour (0-23)
 * @returns {string} Formatted hour label (e.g., "9 AM", "12 PM")
 */
export const formatHourLabel = (hour) => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour} ${period}`;
};

/**
 * Format date to display format
 * @param {string|Date} date - Date to format
 * @param {string} format - Format string ('short' | 'long' | 'time')
 * @returns {string} Formatted date
 */
export const formatDate = (date, format = 'short') => {
  const d = new Date(date);

  if (format === 'short') {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit',
    });
  }

  if (format === 'long') {
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  if (format === 'time') {
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  return d.toLocaleDateString();
};

// ============================================================================
// POSITION CALCULATIONS
// ============================================================================

/**
 * Unified calculation for event geometry (position and size).
 * Works for both Time Grid (vertical) and Timeline (horizontal).
 *
 * @param {string|Date} start - Event start time
 * @param {string|Date} end - Event end time
 * @param {number} startHour - The hour the calendar grid starts (e.g., 0 for midnight)
 * @param {number} pixelsPerHour - Width (timeline) or Height (time grid) of one hour slot
 * @param {'vertical'|'horizontal'} orientation - Layout direction
 * @param {number} baseOffset - Optional starting offset (e.g., gutterHeight for TimeGrid)
 * @returns {{top: number, height: number}|{left: number, width: number}}
 */
export const calculateEventPosition = (
  start,
  end,
  startHour,
  pixelsPerHour = 120,
  orientation = 'horizontal',
  baseOffset = 0,
) => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  // 1. Calculate duration in hours (for Size)
  const durationMs = endDate - startDate;
  const durationHours = durationMs / 1000 / 60 / 60;
  const pixelSize = durationHours * pixelsPerHour;

  // 2. Calculate start offset in hours (for Position)
  const currentHour = startDate.getHours();
  const currentMinute = startDate.getMinutes();
  const hoursFromStart = currentHour + currentMinute / 60 - startHour;
  const pixelPosition = hoursFromStart * pixelsPerHour + baseOffset;

  // 3. Return correct properties based on orientation
  if (orientation === 'vertical') {
    return { top: pixelPosition, height: pixelSize };
  }

  return { left: pixelPosition, width: pixelSize };
};

/**
 * Calculate current time position in the grid
 * @param {number} startHour - Calendar start hour
 * @param {number} endHour - Calendar end hour
 * @param {number} pixelsPerHour - Pixels per hour
 * @param {Date} currentTime - Current time (defaults to now)
 * @returns {number|null} Position in pixels, or null if outside range
 */
export const calculateCurrentTimePosition = (
  startHour,
  endHour,
  pixelsPerHour = 120,
  currentTime = new Date(),
  gutterTimeSlotHeight = 0,
) => {
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();

  // Check if current time is within the displayed time range
  if (hours < startHour || hours > endHour) {
    return null;
  }

  const minutesFromStart = (hours - startHour) * 60 + minutes;
  return (minutesFromStart / 60) * pixelsPerHour + gutterTimeSlotHeight;
};

// ============================================================================
// DATE MANIPULATION
// ============================================================================

/**
 * Check if an event is in the past
 * @param {string|Date} eventEndTime - Event end time
 * @param {Date} referenceTime - Reference time (defaults to now)
 * @returns {boolean} True if event has ended
 */
export const isEventPast = (eventEndTime, referenceTime = new Date()) => {
  return new Date(eventEndTime) < referenceTime;
};

/**
 * Check if two dates are on the same day
 * @param {string|Date} date1 - First date
 * @param {string|Date} date2 - Second date
 * @returns {boolean} True if same day
 */
export const isSameDay = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

/**
 * Get duration between two times in minutes
 * @param {string|Date} start - Start time
 * @param {string|Date} end - End time
 * @returns {number} Duration in minutes
 */
export const getDurationMinutes = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.round((endDate - startDate) / 1000 / 60);
};

/**
 * Snap time to interval (for drag-to-create functionality)
 * @param {Date} time - Time to snap
 * @param {number} intervalMinutes - Interval in minutes (default: 30)
 * @returns {Date} Snapped time
 */
export const snapToInterval = (time, intervalMinutes = 30) => {
  const snapped = new Date(time);
  const minutes = snapped.getMinutes();
  const snappedMinutes = Math.round(minutes / intervalMinutes) * intervalMinutes;
  snapped.setMinutes(snappedMinutes);
  snapped.setSeconds(0);
  snapped.setMilliseconds(0);
  return snapped;
};

// ============================================================================
// TIME SLOT GENERATION
// ============================================================================

/**
 * Generate time slots for the calendar grid
 * @param {number} startHour - Start hour (0-23)
 * @param {number} endHour - End hour (0-23)
 * @returns {Array<{hour: number, label: string}>} Array of time slots
 */
export const generateTimeSlots = (startHour = 0, endHour = 23) => {
  const slots = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    slots.push({
      hour,
      label: formatHourLabel(hour),
    });
  }
  return slots;
};

// ============================================================================
// EVENT GROUPING
// ============================================================================

/**
 * Group events by resource ID
 * @param {Array} events - Array of events with resourceId
 * @param {Array} resources - Array of resources with id
 * @returns {Object} Object mapping resource ID to events array
 */
// export const groupEventsByResource = (events, resources) => {
//   const grouped = {};
//   resources.forEach((resource) => {
//     grouped[resource.id] = events.filter((event) => event.resourceId === resource.id);
//   });
//   return grouped;
// };

// Input:
// [
//   {
//       "space_id": "CTR-01-SPC-33",
//       "space_name": "Conference room",
//       "bookings": [
//           {
//               "name": "BK-CTR-01-SPC-33-054",
//               "space_id": "CTR-01-SPC-33",
//               "space_name": "Conference room",
//               "booking_title": "Test 1",
//               "client_name": "Kemy healthcare",
//               "resource_type": "Conference Room",
//               "booking_date": "2026-01-20",
//               "start_time": "16:30:00",
//               "end_time": "17:00:00",
//               "all_day": 0,
//               "description": "",
//               "status": "Upcoming",
//               "recurring_booking_ref": null,
//               "color_gradient": null,
//               "is_recurrence": false
//           },
//           {
//               "name": "BK-CTR-01-SPC-33-056",
//               "space_id": "CTR-01-SPC-33",
//               "space_name": "Conference room",
//               "booking_title": "Conference room",
//               "client_name": "Kemy healthcare",
//               "resource_type": "Conference Room",
//               "booking_date": "2026-01-20",
//               "start_time": "17:00:00",
//               "end_time": "17:30:00",
//               "all_day": 0,
//               "description": "",
//               "status": "Upcoming",
//               "recurring_booking_ref": "RBK-CTR-01-SPC-33-55",
//               "color_gradient": null,
//               "is_recurrence": true
//           },
//           {
//               "name": "BK-CTR-01-SPC-33-058",
//               "space_id": "CTR-01-SPC-33",
//               "space_name": "Conference room",
//               "booking_title": "cr",
//               "client_name": "Kemy healthcare",
//               "resource_type": "Conference Room",
//               "booking_date": "2026-01-20",
//               "start_time": "17:10:00",
//               "end_time": "17:40:00",
//               "all_day": 0,
//               "description": "",
//               "status": "Ongoing",
//               "recurring_booking_ref": null,
//               "color_gradient": null,
//               "is_recurrence": false
//           }
//       ]
//   }
// ]
export const groupEventsByResource = (events, eventTransformer) => {
  const grouped = {};
  events.forEach((event) => {
    if (!grouped[event.space_id]) {
      grouped[event.space_id] = [];
    }
    grouped[event.space_id] = eventTransformer(event.bookings);
  });
  return grouped;
};

/**
 * Detect overlapping events in a single resource
 * @param {Array} events - Array of events for a resource
 * @returns {Array} Array of events with overlap information
 */
export const detectOverlaps = (events) => {
  // Sort by start time
  const sorted = [...events].sort((a, b) => new Date(a.start) - new Date(b.start));

  return sorted.map((event, index) => {
    const overlaps = sorted.filter((other, otherIndex) => {
      if (index === otherIndex) return false;
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      const otherStart = new Date(other.start);
      const otherEnd = new Date(other.end);

      return (
        (otherStart >= eventStart && otherStart < eventEnd) ||
        (otherEnd > eventStart && otherEnd <= eventEnd) ||
        (otherStart <= eventStart && otherEnd >= eventEnd)
      );
    });

    return {
      ...event,
      hasOverlap: overlaps.length > 0,
      overlapCount: overlaps.length,
    };
  });
};

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate if an event fits within calendar bounds
 * @param {string|Date} start - Event start time
 * @param {string|Date} end - Event end time
 * @param {number} startHour - Calendar start hour
 * @param {number} endHour - Calendar end hour
 * @returns {{valid: boolean, reason: string|null}} Validation result
 */
export const validateEventBounds = (start, end, startHour, endHour) => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (endDate <= startDate) {
    return { valid: false, reason: 'End time must be after start time' };
  }

  const startHourValue = startDate.getHours();
  const endHourValue = endDate.getHours();

  if (startHourValue < startHour || endHourValue > endHour) {
    return { valid: false, reason: 'Event is outside calendar time range' };
  }

  return { valid: true, reason: null };
};

export const areTimesAdjacent = (timeA, timeB) => {
  if (!timeA || !timeB) return false;
  const t1 = new Date(timeA).getTime();
  const t2 = new Date(timeB).getTime();
  return Math.abs(t1 - t2) < 1000; // 1 second tolerance
};

export const isGridLine = (time) => {
  const date = new Date(time);
  // Returns true if minute is 0 (e.g., 4:00, 5:00)
  return date.getMinutes() === 0;
};
