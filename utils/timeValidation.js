// Time input validation utilities

/**
 * Validate and format hour input (0-23)
 * @param {string} value - The hour string to validate
 * @param {string} defaultValue - Default value if invalid
 * @returns {string} Validated and formatted hour string
 */
export const validateHour = (value, defaultValue = '10') => {
  const hour = parseInt(value, 10);
  if (isNaN(hour) || hour < 0 || hour > 23) {
    return defaultValue;
  }
  return hour.toString().padStart(2, '0');
};

/**
 * Validate and format minute input (0-59)
 * @param {string} value - The minute string to validate
 * @param {string} defaultValue - Default value if invalid
 * @returns {string} Validated and formatted minute string
 */
export const validateMinute = (value, defaultValue = '30') => {
  const minute = parseInt(value, 10);
  if (isNaN(minute) || minute < 0 || minute > 59) {
    return defaultValue;
  }
  return minute.toString().padStart(2, '0');
};
