import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { format } from 'date-fns';
import {
  checkSpaceAvailability,
  clearConflictCheck,
  fetchBookingDetail,
  updateSpaceBookingScoped,
  validateRecurringConflicts,
} from '@/redux/bookingSlice';
import { formatTimeFromAPI, formatTimeToAPI, validateTimePair } from '@/utils/date-utils';
import {
  BOOKING_EDIT_SCOPE,
  RecurrenceType,
  isStatusUpcoming,
} from '@/components/bookings/constants';
import { showErrorToast, showSuccessToast } from '@/utils/error-utils';

export const useBookingTimeEditor = ({
  booking,
  selectedBookingId,
  recurrence,
  shouldShowRecurrence,
  effectiveEditScope,
  conflictCheck,
  handleFieldChange,
}) => {
  const dispatch = useDispatch();

  const [isTimeEditing, setIsTimeEditing] = useState(false);
  const [isTimePopoverOpen, setIsTimePopoverOpen] = useState(false);
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);
  const [timeInputs, setTimeInputs] = useState({ start_time: '', end_time: '' });
  const [timeErrors, setTimeErrors] = useState({ start_time: '', end_time: '' });
  const [timeEditConflicts, setTimeEditConflicts] = useState([]);

  const conflictCheckRef = useRef(null);
  const oneTimeConflictCheckRef = useRef(null);
  const lastOneTimeParamsRef = useRef(null);
  const timeFieldRef = useRef(null);

  const isTimeEditable = isStatusUpcoming(booking?.status || '');

  // When booking is part of a series but edit scope is THIS_ONLY,
  // treat it like a single booking for conflict checks.
  const isSeriesScope = shouldShowRecurrence && effectiveEditScope !== BOOKING_EDIT_SCOPE.THIS_ONLY;

  const startTimeDisplay =
    isTimeEditing && timeInputs.start_time
      ? timeInputs.start_time
      : formatTimeFromAPI(booking?.start_time) || '';

  const endTimeDisplay =
    isTimeEditing && timeInputs.end_time
      ? timeInputs.end_time
      : formatTimeFromAPI(booking?.end_time) || '';

  const showOneTimeConflictError =
    !timeErrors.start_time &&
    !timeErrors.end_time &&
    // Show one-time conflict error for non-recurring bookings AND
    // for recurring series when edit scope is THIS_ONLY
    !isSeriesScope &&
    booking?.space_id &&
    conflictCheck?.oneTime?.statusCode === 409 &&
    conflictCheck?.oneTime?.errorOn === 'booking_time' &&
    Boolean(conflictCheck?.oneTime?.message);

  // Reset time editing state on unmount
  useEffect(() => {
    return () => {
      setIsTimeEditing(false);
      setIsTimePopoverOpen(false);
      setTimeInputs({ start_time: '', end_time: '' });
      setTimeErrors({ start_time: '', end_time: '' });
      if (oneTimeConflictCheckRef.current) {
        clearTimeout(oneTimeConflictCheckRef.current);
        oneTimeConflictCheckRef.current = null;
      }
      lastOneTimeParamsRef.current = null;
    };
  }, []);

  // Save time with effective scope (options.ignoreConflictedDates for confirm modal flow)
  const performTimeSave = useCallback(
    async (scope, timeInputsObj, options = {}) => {
      if (!booking || !selectedBookingId) return;

      const currentBookingId = booking?.name || booking?.id || selectedBookingId;
      const startTimeAPI = formatTimeToAPI(timeInputsObj?.start_time);
      const endTimeAPI = formatTimeToAPI(timeInputsObj?.end_time);

      if (!startTimeAPI || !endTimeAPI) {
        showErrorToast('Invalid time values');
        return;
      }

      const payload = { start_time: startTimeAPI, end_time: endTimeAPI };
      if (options.ignoreConflictedDates) {
        payload.ignore_conflicted_dates = 1;
      }

      const apiScope = scope || 'THIS_ONLY';

      try {
        await dispatch(
          updateSpaceBookingScoped({
            bookingId: currentBookingId,
            scope: apiScope,
            updates: payload,
          }),
        ).unwrap();

        showSuccessToast('Time updated successfully');
        dispatch(fetchBookingDetail(currentBookingId));
        setTimeEditConflicts([]);
        setIsTimeEditing(false);
        setIsTimePopoverOpen(false);
      } catch (error) {
        console.error('Failed to update time:', error);
        showErrorToast(error, { defaultMessage: 'Failed to update time' });
      }
    },
    [booking, selectedBookingId, shouldShowRecurrence, dispatch],
  );

  // Handle time field click to enter edit mode (via popover)
  const handleTimeClick = useCallback(() => {
    if (!isTimeEditable) return;

    const startTime = formatTimeFromAPI(booking?.start_time) || '';
    const endTime = formatTimeFromAPI(booking?.end_time) || '';
    setTimeInputs({ start_time: startTime, end_time: endTime });
    setIsTimeEditing(true);
    setTimeErrors({ start_time: '', end_time: '' });
    setIsStartOpen(true);
    setIsEndOpen(false);
    setIsTimePopoverOpen(true);

    // Clear previous conflict checks when entering edit mode
    dispatch(clearConflictCheck());
    lastOneTimeParamsRef.current = null;
  }, [isTimeEditable, booking, dispatch]);

  // Handle time value change with validation
  const handleTimeValueChange = useCallback(
    (field, timeStr) => {
      const updatedInputs = { ...timeInputs, [field]: timeStr };
      setTimeInputs(updatedInputs);

      const startTime = field === 'start_time' ? timeStr : updatedInputs.start_time;
      const endTime = field === 'end_time' ? timeStr : updatedInputs.end_time;

      const newErrors = {};

      if (!startTime && !endTime) {
        setTimeErrors({ start_time: '', end_time: '' });
        return;
      }

      if (startTime && !endTime) {
        newErrors.end_time = 'Please select an end time';
      } else if (!startTime && endTime) {
        newErrors.start_time = 'Please select a start time';
      }

      if (startTime && endTime) {
        const { errors: pairErrors } = validateTimePair(startTime, endTime);
        if (pairErrors.start_time) {
          newErrors.start_time = pairErrors.start_time;
        }
        if (pairErrors.end_time) {
          newErrors.end_time = pairErrors.end_time;
        }
      }

      if (startTime && booking?.booking_date) {
        const today = new Date();
        const bookingDate = new Date(booking.booking_date);
        const isSameDay =
          bookingDate.getFullYear() === today.getFullYear() &&
          bookingDate.getMonth() === today.getMonth() &&
          bookingDate.getDate() === today.getDate();

        if (isSameDay) {
          const startTime24 = formatTimeToAPI(startTime) || '';
          if (startTime24) {
            const candidate = new Date(`${booking.booking_date}T${startTime24}`);
            if (candidate < today) {
              newErrors.start_time = 'Start time cannot be in the past';
            }
          }
        }
      }

      setTimeErrors(newErrors);
    },
    [timeInputs, booking],
  );

  // Handle time selection from autocomplete - only update local values
  const handleTimeSelect = useCallback(
    (field, time) => {
      handleTimeValueChange(field, time);
      if (field === 'start_time') {
        setIsStartOpen(false);
      } else {
        setIsEndOpen(false);
      }
    },
    [handleTimeValueChange],
  );

  // Time edit Cancel handler
  const handleTimeCancel = useCallback(() => {
    const startTime = formatTimeFromAPI(booking?.start_time) || '';
    const endTime = formatTimeFromAPI(booking?.end_time) || '';
    setTimeInputs({
      start_time: startTime,
      end_time: endTime,
    });
    setTimeErrors({ start_time: '', end_time: '' });
    setIsTimeEditing(false);
    setIsTimePopoverOpen(false);
  }, [booking]);

  // Time edit Save handler
  const handleTimeSave = useCallback(() => {
    const startTime = timeInputs.start_time;
    const endTime = timeInputs.end_time;

    const validationErrors = {};
    if (!startTime) {
      validationErrors.start_time = 'Please select a start time';
    }
    if (!endTime) {
      validationErrors.end_time = 'Please select an end time';
    }

    if (startTime && endTime) {
      const { isValid, errors } = validateTimePair(startTime, endTime);
      if (!isValid) {
        if (errors.start_time) {
          validationErrors.start_time = errors.start_time;
        }
        if (errors.end_time) {
          validationErrors.end_time = errors.end_time;
        }
      }

      if (booking?.booking_date) {
        const today = new Date();
        const bookingDate = new Date(booking.booking_date);
        const isSameDay =
          bookingDate.getFullYear() === today.getFullYear() &&
          bookingDate.getMonth() === today.getMonth() &&
          bookingDate.getDate() === today.getDate();

        if (isSameDay) {
          const startTime24 = formatTimeToAPI(startTime) || '';
          if (startTime24) {
            const candidate = new Date(`${booking.booking_date}T${startTime24}`);
            if (candidate < today) {
              validationErrors.start_time = 'Start time cannot be in the past';
            }
          }
        }
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setTimeErrors(validationErrors);
      return;
    }

    if (shouldShowRecurrence) {
      if (timeEditConflicts.length > 0) {
        return;
      }
      performTimeSave(effectiveEditScope, {
        start_time: startTime,
        end_time: endTime,
      });
    } else {
      const startTimeAPI = formatTimeToAPI(startTime);
      const endTimeAPI = formatTimeToAPI(endTime);

      if (!startTimeAPI || !endTimeAPI) {
        return;
      }

      if (handleFieldChange) {
        const payload = { start_time: startTimeAPI, end_time: endTimeAPI };

        // Call twice so change-detection works per-field, but send both times in payload
        handleFieldChange('start_time', startTimeAPI, {
          payload,
          silent: true,
          successMessage: 'Time updated successfully',
        });
        handleFieldChange('end_time', endTimeAPI, {
          payload,
          successMessage: 'Time updated successfully',
        });
      } else {
        const currentBookingId = booking?.name || booking?.id || selectedBookingId;
        const payload = { start_time: startTimeAPI, end_time: endTimeAPI };

        dispatch(
          updateSpaceBookingScoped({
            bookingId: currentBookingId,
            scope: 'THIS_ONLY',
            updates: payload,
          }),
        )
          .unwrap()
          .then(() => {
            showSuccessToast('Time updated successfully');
            dispatch(fetchBookingDetail(currentBookingId));
          })
          .catch((error) => {
            console.error('Failed to update time:', error);
            showErrorToast(error, { defaultMessage: 'Failed to update time' });
          });
      }

      setIsTimeEditing(false);
      setIsTimePopoverOpen(false);
    }
  }, [
    timeInputs.start_time,
    timeInputs.end_time,
    booking,
    shouldShowRecurrence,
    timeEditConflicts.length,
    performTimeSave,
    effectiveEditScope,
    handleFieldChange,
    dispatch,
    selectedBookingId,
  ]);

  const handleTimeSaveWithIgnore = useCallback(() => {
    performTimeSave(
      effectiveEditScope,
      { start_time: timeInputs.start_time, end_time: timeInputs.end_time },
      { ignoreConflictedDates: true },
    );
  }, [performTimeSave, effectiveEditScope, timeInputs.start_time, timeInputs.end_time]);

  // Check conflicts when time popover is open and user edits time (recurring)
  useEffect(() => {
    if (
      !isTimePopoverOpen ||
      !isTimeEditing ||
      !booking ||
      !isSeriesScope ||
      !timeInputs.start_time ||
      !timeInputs.end_time
    ) {
      if (!isTimePopoverOpen || !isTimeEditing) setTimeEditConflicts([]);
      return;
    }

    const bookingDate = booking?.booking_date;
    if (!bookingDate) return;

    const startTimeAPI = formatTimeToAPI(timeInputs.start_time);
    const endTimeAPI = formatTimeToAPI(timeInputs.end_time);
    if (!startTimeAPI || !endTimeAPI) return;

    const recurrenceType = recurrence?.recurrence || recurrence?.type || RecurrenceType.ONE_TIME;
    if (recurrenceType === RecurrenceType.ONE_TIME) return;

    const occurrence = recurrence?.occurrence || 0;
    const recurrenceEndDate = recurrence?.recurrence_end_date || recurrence?.endDate || '';
    const recurringRef = recurrence?.name || booking?.recurring_booking_ref || null;

    const payload = {
      space_id: booking?.space_id,
      recurrence: recurrenceType,
      occurrence: occurrence || 0,
      booking_date: format(new Date(bookingDate), 'yyyy-MM-dd'),
      recurrence_end_date: recurrenceEndDate || '',
      week_days: recurrence?.week_days || recurrence?.daysOfWeek || '',
      recurring_date: recurrence?.recurring_date || recurrence?.dayOfMonth || null,
      recurring_month: recurrence?.recurring_month || recurrence?.monthOfYear || null,
      start_time: startTimeAPI,
      end_time: endTimeAPI,
      exclude_recurring_ref: recurringRef,
    };

    if (conflictCheckRef.current) clearTimeout(conflictCheckRef.current);
    conflictCheckRef.current = setTimeout(async () => {
      try {
        const result = await dispatch(validateRecurringConflicts(payload)).unwrap();
        if (result.status_code === 409 && result.dates) {
          setTimeEditConflicts(result.dates || []);
        } else {
          setTimeEditConflicts([]);
        }
      } catch (error) {
        console.error('Failed to check conflicts:', error);
        setTimeEditConflicts([]);
      }
    }, 400);

    return () => {
      if (conflictCheckRef.current) clearTimeout(conflictCheckRef.current);
    };
  }, [
    isTimePopoverOpen,
    isTimeEditing,
    timeInputs.start_time,
    timeInputs.end_time,
    booking,
    isSeriesScope,
    recurrence,
    dispatch,
  ]);

  // One-time booking conflict check (time-based) for time edit popover
  useEffect(() => {
    if (
      !isTimePopoverOpen ||
      !isTimeEditing ||
      isSeriesScope ||
      !booking?.space_id ||
      !booking?.booking_date ||
      !timeInputs.start_time ||
      !timeInputs.end_time
    ) {
      return;
    }

    if (timeErrors.start_time || timeErrors.end_time) {
      return;
    }

    const bookingDate = booking.booking_date;
    const startTimeAPI = formatTimeToAPI(timeInputs.start_time) || '';
    const endTimeAPI = formatTimeToAPI(timeInputs.end_time) || '';

    if (!startTimeAPI || !endTimeAPI) {
      return;
    }

    const payload = {
      space_id: booking.space_id,
      booking_date: bookingDate,
      start_time: startTimeAPI,
      end_time: endTimeAPI,
    };

    const key = JSON.stringify(payload);
    if (lastOneTimeParamsRef.current === key) {
      return;
    }
    lastOneTimeParamsRef.current = key;

    if (oneTimeConflictCheckRef.current) {
      clearTimeout(oneTimeConflictCheckRef.current);
    }

    oneTimeConflictCheckRef.current = setTimeout(() => {
      dispatch(checkSpaceAvailability(payload));
    }, 400);

    return () => {
      if (oneTimeConflictCheckRef.current) {
        clearTimeout(oneTimeConflictCheckRef.current);
        oneTimeConflictCheckRef.current = null;
      }
    };
  }, [
    isTimePopoverOpen,
    isTimeEditing,
    isSeriesScope,
    booking,
    timeInputs.start_time,
    timeInputs.end_time,
    timeErrors.start_time,
    timeErrors.end_time,
    dispatch,
  ]);

  const timeEditor = {
    isTimeEditable,
    isTimeEditing,
    isTimePopoverOpen,
    handleTimeClick,
    timeFieldRef,
    isStartOpen,
    isEndOpen,
    setIsStartOpen,
    setIsEndOpen,
    startTimeDisplay,
    endTimeDisplay,
    timeErrors,
    onTimeValueChange: handleTimeValueChange,
    onTimeSelect: handleTimeSelect,
    showOneTimeConflictError,
    timeEditConflicts,
    onSave: handleTimeSave,
    onCancel: handleTimeCancel,
  };

  return {
    timeEditor,
    handleTimeSaveWithIgnore,
  };
};
