/**
 * Date and time format conversion utilities
 */

/**
 * Convert MM/DD/YYYY to YYYY-MM-DD
 */
export function convertDateToISO(dateStr: string): { success: boolean; date?: string; error?: string } {
  // Remove any whitespace
  const cleaned = dateStr.trim();
  
  // Check format MM/DD/YYYY
  const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = cleaned.match(dateRegex);
  
  if (!match) {
    return { success: false, error: "Invalid date format. Expected MM/DD/YYYY" };
  }
  
  const month = parseInt(match[1], 10);
  const day = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  
  // Validate ranges
  if (month < 1 || month > 12) {
    return { success: false, error: "Month must be between 01 and 12" };
  }
  
  if (day < 1 || day > 31) {
    return { success: false, error: "Day must be between 01 and 31" };
  }
  
  if (year < 1900 || year > 2100) {
    return { success: false, error: "Year must be between 1900 and 2100" };
  }
  
  // Create date object to validate
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return { success: false, error: "Invalid date" };
  }
  
  // Format as YYYY-MM-DD
  const isoDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { success: true, date: isoDate };
}

/**
 * Convert YYYY-MM-DD to MM/DD/YYYY
 */
export function convertDateToDisplay(isoDate: string): string {
  const date = new Date(isoDate + "T00:00:00");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

/**
 * Convert HH:MM to hours and minutes
 */
export function convertTimeToHoursMinutes(timeStr: string): {
  success: boolean;
  hours?: number;
  minutes?: number;
  error?: string;
} {
  // Remove any whitespace
  const cleaned = timeStr.trim();
  
  // Check format HH:MM
  const timeRegex = /^(\d{1,2}):(\d{2})$/;
  const match = cleaned.match(timeRegex);
  
  if (!match) {
    return { success: false, error: "Invalid time format. Expected HH:MM" };
  }
  
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  
  // Validate ranges
  if (hours < 0 || hours > 23) {
    return { success: false, error: "Hours must be between 00 and 23" };
  }
  
  if (minutes < 0 || minutes > 59) {
    return { success: false, error: "Minutes must be between 00 and 59" };
  }
  
  return { success: true, hours, minutes };
}

/**
 * Convert hours and minutes to HH:MM
 */
export function convertHoursMinutesToTime(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * Format date input with automatic slashes
 */
export function formatDateInput(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, "");
  
  // Add slashes at appropriate positions
  if (digits.length <= 2) {
    return digits;
  } else if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  } else {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  }
}

/**
 * Format time input with automatic colon
 */
export function formatTimeInput(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, "");
  
  // Add colon at appropriate position
  if (digits.length <= 2) {
    return digits;
  } else {
    return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
  }
}

