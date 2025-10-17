// Date and time formatting utilities
import { MONTH_NAMES_SHORT } from '../constants/dateConstants';

/**
 * Format a date object to "Day Month Year" format
 * @param {Date} date - The date to format
 * @param {string} lang - Language code ('pl' or 'en')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, lang = 'en') => {
  const months = MONTH_NAMES_SHORT[lang] || MONTH_NAMES_SHORT.en;
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

/**
 * Format a time object to "HH:MM" format
 * @param {Date} time - The time to format
 * @returns {string} Formatted time string
 */
export const formatTime = (time) => {
  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Generate calendar days for a month view (6 weeks, 42 days)
 * Starts from Monday of the week containing the first day of the month
 * @param {number} year - The year
 * @param {number} month - The month (0-11)
 * @returns {Date[]} Array of 42 Date objects
 */
export const generateMonthCalendarDays = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);

  // Calculate Monday offset
  const dayOfWeek = firstDay.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  startDate.setDate(startDate.getDate() - mondayOffset);

  // Generate 42 days (6 weeks)
  return Array.from({ length: 42 }, (_, i) => {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + i);
    return day;
  });
};

/**
 * Format service duration to human-readable string
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration (e.g., "1h 30m" or "45m")
 */
export const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};
