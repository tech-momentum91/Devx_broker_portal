import { useMemo, useState, useCallback } from 'react';
import { useScheduleContext } from '@/components/ui/schedule/schedule-root';
import { useAutoScrollToCurrentTime } from '@/hooks/use-auto-scroll-to-current-time';
import {
  generateTimeSlots,
  groupEventsByResource,
  calculateCurrentTimePosition,
} from '@/components/ui/schedule/schedule-utils';

const MIN_EVENT_DURATION = 30 * 60 * 1000; // 30 minutes

export const useScheduleGridLogic = ({
  resources,
  events,
  viewDate,
  startHour,
  endHour,
  slotSize,
  gutterSize = 0,
  orientation = 'vertical', // 'vertical' | 'horizontal'
  enableDragToCreate,
  allowPastEventCreation,
  onSlotMouseUp: onExternalSlotMouseUp,
  showCurrentTime,
}) => {
  const { currentTime, onSlotClick, eventTransformer } = useScheduleContext();

  // --- 1. Auto Scroll ---
  const scrollRef = useAutoScrollToCurrentTime({
    viewDate,
    currentTime,
    startHour,
    endHour,
    slotSize,
    gutterSize,
    direction: orientation,
  });

  // --- 2. Memoized Data Calculations ---
  const timeSlots = useMemo(() => generateTimeSlots(startHour, endHour), [startHour, endHour]);

  const eventsByResource = useMemo(
    () => groupEventsByResource(events, eventTransformer),
    [events, eventTransformer],
  );

  const currentTimePos = useMemo(() => {
    if (!showCurrentTime) return null;
    const viewDateObj = new Date(viewDate);
    const isToday = viewDateObj.toDateString() === currentTime.toDateString();

    return isToday
      ? calculateCurrentTimePosition(startHour, endHour, slotSize, currentTime, gutterSize)
      : null;
  }, [showCurrentTime, viewDate, currentTime, startHour, endHour, slotSize, gutterSize]);

  const getNextEventStart = useCallback(
    (resourceId, startTime) => {
      const resourceEvents = eventsByResource[resourceId] || [];
      let nextStart = null;
      for (const event of resourceEvents) {
        const eventStart = new Date(event.start);
        if (eventStart > startTime && (!nextStart || eventStart < nextStart)) {
          nextStart = eventStart;
        }
      }
      return nextStart;
    },
    [eventsByResource],
  );

  /** Returns the next available start time at or after requestedTime (snaps past overlapping events). */
  const getNextAvailableStartTime = useCallback(
    (resourceId, requestedTime) => {
      const resourceEvents = eventsByResource[resourceId] || [];
      let nextAvailable = new Date(requestedTime);
      for (const event of resourceEvents) {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        if (eventStart <= requestedTime && eventEnd > requestedTime && eventEnd > nextAvailable) {
          nextAvailable = new Date(eventEnd);
        }
      }
      return nextAvailable;
    },
    [eventsByResource],
  );

  const isSlotInPast = useCallback(
    (hour) => {
      if (allowPastEventCreation) return false;
      const slotDate = new Date(viewDate);
      // Check if the next hour has started (meaning this entire hour slot is past)
      slotDate.setHours(hour + 1, 0, 0, 0);
      return slotDate < new Date();
    },
    [allowPastEventCreation, viewDate],
  );

  // --- 3. Drag to Create Logic ---
  const [dragState, setDragState] = useState({
    isCreating: false,
    start: null, // { time: Date, pixel: number }
    end: null, // { time: Date, pixel: number }
    resourceId: null,
  });

  const handleDragStart = useCallback(
    (e, resourceId, hour, slotOriginPixel) => {
      if (!enableDragToCreate || e.target.closest('.calendar-event-wrapper')) {
        return;
      }
      if (isSlotInPast(hour)) {
        return;
      }

      e.preventDefault();

      // Calculate Time
      const startDate = new Date(viewDate);
      startDate.setHours(hour, 0, 0, 0);

      // Calculate Coordinates (Abstracting X vs Y based on orientation)
      const rect = e.currentTarget.getBoundingClientRect();
      const clientPos = orientation === 'horizontal' ? e.clientX : e.clientY;
      const rectOrigin = orientation === 'horizontal' ? rect.left : rect.top;

      const relativePos = clientPos - rectOrigin;
      const minutesInSlot = (relativePos / slotSize) * 60;
      const snappedMinutes = Math.floor(minutesInSlot / 30) * 30;
      startDate.setMinutes(snappedMinutes);

      // Determine the 30-min slot window we are starting from
      const slotStart = new Date(startDate);
      slotStart.setSeconds(0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + 30);

      // If this entire 30-min slot is already occupied by existing events
      // (possibly by multiple back-to-back events), do not allow drag-creation to start here.
      const resourceEvents = eventsByResource[resourceId] || [];
      const overlappingIntervals = [];

      for (const event of resourceEvents) {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);

        // Compute overlap between [eventStart, eventEnd] and [slotStart, slotEnd]
        const overlapStart = new Date(Math.max(eventStart.getTime(), slotStart.getTime()));
        const overlapEnd = new Date(Math.min(eventEnd.getTime(), slotEnd.getTime()));

        if (overlapEnd > overlapStart) {
          overlappingIntervals.push({ start: overlapStart, end: overlapEnd });
        }
      }

      if (overlappingIntervals.length > 0) {
        overlappingIntervals.sort((a, b) => a.start - b.start);

        const mergedStart = overlappingIntervals[0].start;
        let mergedEnd = overlappingIntervals[0].end;
        let hasGap = false;

        for (let i = 1; i < overlappingIntervals.length; i += 1) {
          const current = overlappingIntervals[i];
          if (current.start > mergedEnd) {
            // Found a gap in coverage inside the slot
            hasGap = true;
            break;
          }
          if (current.end > mergedEnd) {
            mergedEnd = current.end;
          }
        }

        const fullyCovered =
          !hasGap && mergedStart <= slotStart && mergedEnd >= slotEnd && mergedEnd > mergedStart;

        if (fullyCovered) {
          // Entire 30-min slot is already occupied – do not start creating a new event
          return;
        }
      }

      // If slot overlaps an existing event, snap start to next available time (e.g. 7:00 → 7:02 when previous ends at 7:02)
      const adjustedStart = getNextAvailableStartTime(resourceId, startDate);
      adjustedStart.setSeconds(0, 0);
      const startTimeToUse = adjustedStart;

      // Check if this specific 30-min slot is in the past
      const now = new Date();
      const slotEndTime = new Date(startDate);
      slotEndTime.setMinutes(slotEndTime.getMinutes() + 30);

      // If the 30-min slot has completely passed, don't allow creation
      const slotEndForCheck = new Date(startTimeToUse);
      slotEndForCheck.setMinutes(slotEndForCheck.getMinutes() + 30);
      if (!allowPastEventCreation && slotEndForCheck <= now) {
        return;
      }

      const startMinutesFromHour =
        startTimeToUse.getMinutes() / 60 + startTimeToUse.getSeconds() / 3600;
      const absolutePixel = slotOriginPixel + startMinutesFromHour * slotSize;

      setDragState({
        isCreating: true,
        resourceId,
        start: { time: startTimeToUse, pixel: absolutePixel },
        end: { time: startTimeToUse, pixel: absolutePixel },
      });
    },
    [
      enableDragToCreate,
      isSlotInPast,
      viewDate,
      orientation,
      slotSize,
      allowPastEventCreation,
      getNextAvailableStartTime,
    ],
  );

  const handleDragMove = useCallback(
    (e, resourceId, hour, slotOriginPixel) => {
      if (dragState.isCreating && dragState.resourceId === resourceId && dragState.start) {
        const startTime = dragState.start.time;
        const startHour = startTime.getHours();
        const startDate = new Date(startTime);
        startDate.setHours(0, 0, 0, 0); // Get the date part only

        const endDate = new Date(startDate);
        endDate.setHours(hour, 0, 0, 0);

        const rect = e.currentTarget.getBoundingClientRect();
        const clientPos = orientation === 'horizontal' ? e.clientX : e.clientY;
        const rectOrigin = orientation === 'horizontal' ? rect.left : rect.top;

        const relativePos = clientPos - rectOrigin;
        const minutesInSlot = (relativePos / slotSize) * 60;
        const snappedMinutes = Math.round(minutesInSlot / 30) * 30;

        endDate.setMinutes(snappedMinutes);

        // Handle midnight crossing: if end time is before start time and we're likely crossing midnight
        // (start hour is late >= 22 and end hour is early <= 1), add a day
        if (endDate <= startTime) {
          const hoursDiff = hour - startHour;
          // If we're dragging from late hours to early hours (crossing midnight)
          // Examples: 23 -> 0, 23 -> 1, 22 -> 0, etc.
          if (startHour >= 22 && hour <= 1) {
            endDate.setDate(endDate.getDate() + 1);
          }
          // Also handle case where hour difference suggests wrapping (e.g., 23 -> 0 = -23 hours)
          else if (hoursDiff < -20) {
            endDate.setDate(endDate.getDate() + 1);
          }
        }

        const now = new Date();
        let clampedEndDate = new Date(endDate);

        // Prevent dragging backwards - end time must be after start time
        // Only clamp if we're not crossing midnight (i.e., endDate is still before startTime after adding day)
        if (clampedEndDate <= startTime) {
          // If dragging backwards (not crossing midnight), clamp to start time + minimum duration
          clampedEndDate = new Date(startTime.getTime() + MIN_EVENT_DURATION);
        }

        // Prevent dragging into the past - end time must be at least current time
        // But also ensure it's still after start time
        if (!allowPastEventCreation) {
          const minEndTime = new Date(
            Math.max(now.getTime(), startTime.getTime() + MIN_EVENT_DURATION),
          );
          if (clampedEndDate < minEndTime) {
            clampedEndDate = new Date(minEndTime);
          }
        }

        const nextEventStart = getNextEventStart(resourceId, startTime);
        if (nextEventStart && clampedEndDate > nextEventStart) {
          clampedEndDate = new Date(nextEventStart);
        }

        // Recalculate pixel position based on clamped time
        // For events crossing midnight, calculate duration in milliseconds and convert to pixels
        const durationMs = clampedEndDate.getTime() - startTime.getTime();
        const durationHours = durationMs / (1000 * 60 * 60);
        const absolutePixel = dragState.start.pixel + durationHours * slotSize;

        setDragState((prev) => ({
          ...prev,
          end: { time: clampedEndDate, pixel: absolutePixel },
        }));
      }
    },
    [
      dragState.isCreating,
      dragState.resourceId,
      dragState.start,
      viewDate,
      orientation,
      slotSize,
      allowPastEventCreation,
      getNextEventStart,
    ],
  );

  const handleDragEnd = useCallback(() => {
    if (dragState.isCreating && dragState.start && dragState.end) {
      let actualStart = dragState.start.time;
      let actualEnd = dragState.end.time;

      // Ensure end is always after start (prevent reverse dragging)
      if (actualEnd <= actualStart) {
        actualEnd = new Date(actualStart.getTime() + MIN_EVENT_DURATION);
      }

      // If start time is in the past, adjust to current time + 1 minute
      const now = new Date();
      if (!allowPastEventCreation && actualStart < now) {
        actualStart = new Date(now.getTime() + 60 * 1000); // Current time + 1 minute
      }

      // Ensure end time is not in the past
      if (!allowPastEventCreation && actualEnd < now) {
        actualEnd = new Date(now.getTime() + 60 * 1000);
      }

      const nextEventStart = getNextEventStart(dragState.resourceId, actualStart);
      const minimumEndTime = new Date(actualStart.getTime() + MIN_EVENT_DURATION);
      if (nextEventStart && nextEventStart < minimumEndTime) {
        setDragState({ isCreating: false, start: null, end: null, resourceId: null });
        return;
      }
      if (nextEventStart && actualEnd > nextEventStart) {
        actualEnd = new Date(nextEventStart);
      }

      // Ensure end is still after start after adjustments
      if (actualEnd <= actualStart) {
        actualEnd = new Date(actualStart.getTime() + MIN_EVENT_DURATION);
      }

      // Enforce minimum duration
      if (actualEnd.getTime() - actualStart.getTime() < MIN_EVENT_DURATION) {
        actualEnd = new Date(minimumEndTime);
      }

      if (onExternalSlotMouseUp) {
        onExternalSlotMouseUp({
          resourceId: dragState.resourceId,
          start: actualStart.toISOString(),
          end: actualEnd.toISOString(),
        });
      }
    }
    // Reset state
    setDragState({ isCreating: false, start: null, end: null, resourceId: null });
  }, [dragState, onExternalSlotMouseUp, allowPastEventCreation, getNextEventStart]);

  // --- 4. Helper for Preview Rendering ---
  const getCreationPreview = useCallback(() => {
    if (!dragState.isCreating || !dragState.start || !dragState.end) return null;

    const startPx = Math.min(dragState.start.pixel, dragState.end.pixel);
    const endPx = Math.max(dragState.start.pixel, dragState.end.pixel);
    const size = Math.max(endPx - startPx, slotSize / 2); // Minimum visual size

    // Return agnostic "offset" and "size" (left/width or top/height)
    return { offset: startPx, size };
  }, [dragState, slotSize]);

  // --- 5. Slot Click Handler ---
  const onSlotClickWrapper = useCallback(
    (resourceId, hour) => {
      if (isSlotInPast(hour) || dragState.isCreating || !onSlotClick) {
        return;
      }

      let start = new Date(viewDate);
      start.setHours(hour, 0, 0, 0);
      start.setSeconds(0, 0);

      const now = new Date();
      // If the slot start is in the past, adjust to current time + 1 minute
      if (start < now) {
        start = new Date(now.getTime() + 60 * 1000);
      }

      // If start falls inside an existing event, snap to the next available time (e.g. 6:00 → 6:30 when 6:00–6:30 is taken)
      start = getNextAvailableStartTime(resourceId, start);
      start.setSeconds(0, 0);

      let end = new Date(start.getTime() + 30 * 60000);

      // Constrain end so we don't suggest a range that overlaps the next event
      const nextEventStart = getNextEventStart(resourceId, start);
      if (nextEventStart && end > nextEventStart) {
        end = new Date(nextEventStart);
        // Prefer full 30 min ending at next event (e.g. 5:30–6:00) when possible
        const candidateStart = new Date(end.getTime() - MIN_EVENT_DURATION);
        if (candidateStart >= now || allowPastEventCreation) {
          start = candidateStart;
        }
      }

      if (end <= start) {
        return;
      }

      onSlotClick({ resourceId, start: start.toISOString(), end: end.toISOString() });
    },
    [
      isSlotInPast,
      dragState.isCreating,
      onSlotClick,
      viewDate,
      allowPastEventCreation,
      getNextEventStart,
      getNextAvailableStartTime,
    ],
  );

  return {
    scrollRef,
    timeSlots,
    eventsByResource,
    currentTimePos,
    isSlotInPast,
    dragState,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    getCreationPreview,
    onSlotClickWrapper,
    currentTime,
  };
};
