/**
 * Validation utilities for study data
 */

import type { StudyRecord, PlanData } from "@/types";
import { formatDate, parseDate } from "@/lib/utils";

/**
 * Validate date string format (YYYY-MM-DD)
 */
export function isValidDateString(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return false;
  }

  const dateObj = new Date(date + "T00:00:00");
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
}

/**
 * Validate study record
 */
export function validateStudyRecord(record: StudyRecord): { valid: boolean; error?: string } {
  if (!record.date || typeof record.date !== "string") {
    return { valid: false, error: "Date is required" };
  }

  if (!isValidDateString(record.date)) {
    return { valid: false, error: "Invalid date format. Expected YYYY-MM-DD" };
  }

  if (typeof record.minutes !== "number" || isNaN(record.minutes)) {
    return { valid: false, error: "Minutes must be a number" };
  }

  if (record.minutes < 0) {
    return { valid: false, error: "Minutes cannot be negative" };
  }

  if (record.minutes > 24 * 60) {
    return { valid: false, error: "Study time cannot exceed 24 hours per day" };
  }

  return { valid: true };
}

/**
 * Validate plan data
 */
export function validatePlanData(plan: PlanData): { valid: boolean; error?: string } {
  if (!plan.date || typeof plan.date !== "string") {
    return { valid: false, error: "Date is required" };
  }

  if (!isValidDateString(plan.date)) {
    return { valid: false, error: "Invalid date format. Expected YYYY-MM-DD" };
  }

  if (typeof plan.hours !== "number" || isNaN(plan.hours)) {
    return { valid: false, error: "Hours must be a number" };
  }

  if (plan.hours < 0 || plan.hours > 24) {
    return { valid: false, error: "Hours must be between 0 and 24" };
  }

  if (typeof plan.minutes !== "number" || isNaN(plan.minutes)) {
    return { valid: false, error: "Minutes must be a number" };
  }

  if (plan.minutes < 0 || plan.minutes >= 60) {
    return { valid: false, error: "Minutes must be between 0 and 59" };
  }

  return { valid: true };
}

/**
 * Sanitize study record (ensure valid values)
 */
export function sanitizeStudyRecord(record: StudyRecord): StudyRecord {
  const normalizedDate = normalizeDateString(record.date);
  return {
    date: normalizedDate,
    minutes: Math.max(0, Math.min(24 * 60, Math.round(record.minutes))),
  };
}

/**
 * Sanitize plan data (ensure valid values)
 */
export function sanitizePlanData(plan: PlanData): PlanData {
  const normalizedDate = normalizeDateString(plan.date);
  const totalMinutes = Math.max(0, Math.min(24 * 60, Math.round(plan.hours) * 60 + Math.round(plan.minutes)));

  return {
    date: normalizedDate,
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
}

function normalizeDateString(date: string): string {
  const trimmed = date.trim();
  if (!trimmed) {
    return trimmed;
  }

  const parsed = parseDate(trimmed);
  if (parsed instanceof Date && !isNaN(parsed.getTime())) {
    return formatDate(parsed);
  }

  // Fallback to original string if parsing fails
  return trimmed;
}

