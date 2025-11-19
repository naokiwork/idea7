/**
 * TypeScript interfaces for Study Hour Calendar data structures
 */

/**
 * Represents a single study record entry
 */
export interface StudyRecord {
  date: string; // Format: YYYY-MM-DD
  minutes: number; // Total minutes studied on this date
}

/**
 * Represents planned study time for a specific date
 */
export interface PlanData {
  date: string; // Format: YYYY-MM-DD
  hours: number;
  minutes: number;
}

/**
 * Represents achievement percentage data
 */
export interface AchievementData {
  date: string;
  plannedMinutes: number;
  actualMinutes: number;
  achievementRate: number; // Percentage (0-100+)
}

/**
 * Represents a date range for custom period filtering
 */
export interface DateRange {
  from: string; // Format: YYYY-MM-DD
  to: string; // Format: YYYY-MM-DD
}

/**
 * Color mapping for achievement rates
 */
export type AchievementColor =
  | "white"
  | "yellow"
  | "green"
  | "brown"
  | "blue"
  | "black"
  | "purple";

export type ColorThemeOption = "classic" | "green-gradient" | "github-green";

/**
 * Represents a single recorded study session with a timestamp
 */
export interface StudySession {
  id: string;
  date: string; // YYYY-MM-DD
  kind: "plan" | "actual";
  minutes: number; // New minutes value after change
  previousMinutes: number;
  recordedAt: string; // ISO timestamp
  source?: string;
}

/**
 * Calendar cell data for rendering
 */
export interface CalendarCell {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  achievementRate: number | null;
  plannedMinutes: number;
  actualMinutes: number;
  color: AchievementColor;
}

