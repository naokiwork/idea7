/**
 * Application constants - centralized configuration values
 * This file contains all magic numbers and configuration constants used throughout the app
 */

/**
 * Calendar configuration
 */
export const CALENDAR_CONFIG = {
  /** Number of weeks to display in calendar grid */
  WEEKS: 6,
  /** Number of days per week */
  DAYS_PER_WEEK: 7,
  /** Total number of cells in calendar grid (6 weeks × 7 days) */
  TOTAL_CELLS: 42,
} as const;

/**
 * Quick select options for study time recording (in minutes)
 */
export const QUICK_SELECT_OPTIONS = [10, 20, 30, 40, 50, 60] as const;

/**
 * Achievement color mapping thresholds
 */
export const ACHIEVEMENT_THRESHOLDS = {
  WHITE_LOW: 0,
  WHITE_HIGH: 49,
  YELLOW_LOW: 50,
  YELLOW_HIGH: 59,
  GREEN_LOW: 60,
  GREEN_HIGH: 69,
  BROWN_LOW: 70,
  BROWN_HIGH: 79,
  BLACK_LOW: 80,
  BLACK_HIGH: 119,
  PURPLE_EXACT: 100,
  BROWN_OVER_LOW: 120,
  BROWN_OVER_HIGH: 129,
  GREEN_OVER_LOW: 130,
  GREEN_OVER_HIGH: 139,
  WHITE_OVER_LOW: 140,
} as const;

/**
 * Time limits
 */
export const TIME_LIMITS = {
  /** Maximum hours per day */
  MAX_HOURS: 24,
  /** Maximum minutes per hour */
  MAX_MINUTES: 59,
  /** Maximum minutes per day (24 hours) */
  MAX_MINUTES_PER_DAY: 24 * 60,
} as const;

/**
 * LocalStorage keys
 */
export const STORAGE_KEYS = {
  RECORDS: "study-records",
  PLANS: "study-plans",
  SESSIONS: "study-sessions",
  BACKUPS: "study-backups",
  VIEW_MODE: "app-view-mode",
  COLOR_THEME: "app-color-theme",
  DAILY_VIEW_DATE: "app-daily-view-date",
  LOCALE: "app-locale",
  SAMPLE_DATA_LOADED: "study-demo-data-loaded",
  TIMER_STATE: "record-modal-timer-state",
} as const;

/**
 * Timer configuration
 */
export const TIMER_CONFIG = {
  RADIUS: 90,
  CIRCUMFERENCE: 2 * Math.PI * 90,
} as const;

/**
 * Modal size constraints
 */
export const MODAL_SIZE = {
  MIN_WIDTH: 420,
  MIN_HEIGHT: 560,
  MAX_WIDTH: 900,
  MAX_HEIGHT: 900,
  DEFAULT_WIDTH: 520,
  DEFAULT_HEIGHT: 720,
} as const;

/**
 * Ring animation timings (in milliseconds)
 */
export const RING_ANIMATION = {
  SWEEP_DELAY: 500,
  SWEEP_DURATION: 3000,
  FLASH_DELAY: 300,
  FLASH_DURATION: 300,
} as const;

/**
 * Development mode flag
 * Set to true to enable console logging in production
 */
export const IS_DEVELOPMENT = process.env.NODE_ENV === "development";

/**
 * Enable console logging based on environment
 */
export const ENABLE_CONSOLE_LOGS = IS_DEVELOPMENT || process.env.NEXT_PUBLIC_ENABLE_LOGS === "true";

