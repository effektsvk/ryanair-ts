/**
 * Format a date to YYYY-MM-DD string
 * @param input - Date object or string in various formats
 * @returns Formatted date string "YYYY-MM-DD"
 */
export function formatDate(input: Date | string): string {
  if (typeof input === 'string') {
    // If already in correct format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      return input;
    }
    // Try to parse the string as a date
    const parsed = new Date(input);
    if (isNaN(parsed.getTime())) {
      throw new Error(`Invalid date string: ${input}`);
    }
    input = parsed;
  }

  const year = input.getFullYear();
  const month = String(input.getMonth() + 1).padStart(2, '0');
  const day = String(input.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Format a time to HH:MM string
 * @param input - Date object or string (HH:MM format)
 * @returns Formatted time string "HH:MM"
 */
export function formatTime(input: Date | string): string {
  if (typeof input === 'string') {
    // If already in correct format, return as-is
    if (/^\d{2}:\d{2}$/.test(input)) {
      return input;
    }
    // Try to parse as a date/time
    const parsed = new Date(input);
    if (isNaN(parsed.getTime())) {
      throw new Error(`Invalid time string: ${input}`);
    }
    input = parsed;
  }

  const hours = String(input.getHours()).padStart(2, '0');
  const minutes = String(input.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

/**
 * Parse an ISO date string to a Date object
 * @param isoString - ISO format date string (e.g., "2023-08-23T08:20:00")
 * @returns Date object
 */
export function parseISODate(isoString: string): Date {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid ISO date string: ${isoString}`);
  }
  return date;
}
