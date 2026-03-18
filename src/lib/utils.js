import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import moment from 'moment';
import _ from 'lodash';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const getInitials = (name) => {
  // null check
  if (!name) return '';
  // check if name is string
  if (typeof name !== 'string') return '';
  // if name is a single word, return the first letter
  if (name.split(' ').length === 1) return name[0];
  // if name is a multi-word, return the first letter of each word
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('');
};

/**
 * Compares two dates in DD/MM/YYYY format using Moment.js
 * @param {string} startDate - Start date in DD/MM/YYYY format
 * @param {string} endDate - End date in DD/MM/YYYY format
 * @returns {boolean} - True if end date is after start date, false otherwise
 */
export const isEndDateAfterStartDate = (startDate, endDate) => {
  if (!startDate || !endDate) return true; // If either date is missing, validation passes

  const startMoment = moment(startDate, 'DD/MM/YYYY', true);
  const endMoment = moment(endDate, 'DD/MM/YYYY', true);

  // Check if dates are valid
  if (!startMoment.isValid() || !endMoment.isValid()) {
    return false;
  }

  return endMoment.isAfter(startMoment);
};

/**
 * Validates if a date string is in correct DD/MM/YYYY format using Moment.js
 * @param {string} dateString - Date string to validate
 * @returns {boolean} - True if date is valid, false otherwise
 */
export const isValidDateFormat = (dateString) => {
  if (!dateString) return true; // Optional field
  return moment(dateString, 'DD/MM/YYYY', true).isValid();
};

/**
 * Parses a date string in DD/MM/YYYY format to a Moment object
 * @param {string} dateString - Date string in DD/MM/YYYY format
 * @returns {moment.Moment|null} - Parsed Moment object or null if invalid
 */
export const parseDateFromString = (dateString) => {
  if (!dateString) return null;

  const momentDate = moment(dateString, 'DD/MM/YYYY', true);
  return momentDate.isValid() ? momentDate : null;
};

/**
 * Validates course date sequence: startDate <= plannedEndDate <= revisedEndDate
 * @param {string} startDate - Course start date
 * @param {string} plannedEndDate - Planned end date
 * @param {string} revisedEndDate - Revised end date
 * @returns {Object} - Validation result with isValid boolean and errors array
 */
export const validateCourseDateSequence = (startDate, plannedEndDate, revisedEndDate) => {
  const errors = [];

  // Parse dates using Moment.js
  const startMoment = startDate ? moment(startDate, 'DD/MM/YYYY', true) : null;
  const plannedMoment = plannedEndDate ? moment(plannedEndDate, 'DD/MM/YYYY', true) : null;
  const revisedMoment = revisedEndDate ? moment(revisedEndDate, 'DD/MM/YYYY', true) : null;

  // Validate individual date formats
  if (startDate && !startMoment.isValid()) {
    errors.push({ field: 'startDate', message: 'Invalid start date format (DD/MM/YYYY)' });
  }

  if (plannedEndDate && !plannedMoment.isValid()) {
    errors.push({
      field: 'plannedEndDate',
      message: 'Invalid planned end date format (DD/MM/YYYY)',
    });
  }

  if (revisedEndDate && !revisedMoment.isValid()) {
    errors.push({
      field: 'revisedEndDate',
      message: 'Invalid revised end date format (DD/MM/YYYY)',
    });
  }

  // If any date format is invalid, return early
  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Validate date sequence
  if (startMoment && plannedMoment && plannedMoment.isSameOrBefore(startMoment)) {
    errors.push({
      field: 'plannedEndDate',
      message: 'Planned end date must be after start date',
    });
  }

  if (startMoment && revisedMoment && revisedMoment.isSameOrBefore(startMoment)) {
    errors.push({
      field: 'revisedEndDate',
      message: 'Revised end date must be after start date',
    });
  }

  if (plannedMoment && revisedMoment && revisedMoment.isSameOrBefore(plannedMoment)) {
    errors.push({
      field: 'revisedEndDate',
      message: 'Revised end date must be after planned end date',
    });
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Validates BIL (Break In Learning) date sequence
 * @param {string} bilStartDate - BIL start date
 * @param {string} bilEndDate - BIL end date
 * @returns {Object} - Validation result with isValid boolean and errors array
 */
export const validateBILDateSequence = (bilStartDate, bilEndDate) => {
  const errors = [];

  // Parse dates using Moment.js
  const startMoment = bilStartDate ? moment(bilStartDate, 'DD/MM/YYYY', true) : null;
  const endMoment = bilEndDate ? moment(bilEndDate, 'DD/MM/YYYY', true) : null;

  // Validate individual date formats
  if (bilStartDate && !startMoment.isValid()) {
    errors.push({ field: 'bilStartDate', message: 'Invalid BIL start date format (DD/MM/YYYY)' });
  }

  if (bilEndDate && !endMoment.isValid()) {
    errors.push({ field: 'bilEndDate', message: 'Invalid BIL end date format (DD/MM/YYYY)' });
  }

  // If any date format is invalid, return early
  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Validate date sequence
  if (startMoment && endMoment && endMoment.isSameOrBefore(startMoment)) {
    errors.push({
      field: 'bilEndDate',
      message: 'BIL end date must be after BIL start date',
    });
  }

  return { isValid: errors.length === 0, errors };
};

export const capitalizeEachWordFirstLetter = (value) => {
  return _.map(value.split(' '), (word) => _.upperFirst(word)).join(' ');
};
