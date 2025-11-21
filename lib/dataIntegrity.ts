/**
 * Data integrity checking utilities for localStorage
 * Validates and repairs corrupted or invalid data structures
 */

import type { StudyRecord, PlanData } from "@/types";
import { isValidDateString } from "./validation";
import { TIME_LIMITS } from "./constants";
import { logWarn } from "./logger";

/**
 * Validate and repair a study record
 */
export function validateAndRepairRecord(record: unknown): StudyRecord | null {
  if (!record || typeof record !== "object") {
    return null;
  }

  const r = record as Record<string, unknown>;

  // Check required fields
  if (typeof r.date !== "string" || !isValidDateString(r.date)) {
    logWarn("Invalid record date, skipping:", r.date);
    return null;
  }

  if (typeof r.minutes !== "number" || isNaN(r.minutes)) {
    logWarn("Invalid record minutes, skipping:", r.minutes);
    return null;
  }

  // Repair invalid values
  const repaired: StudyRecord = {
    date: r.date,
    minutes: Math.max(0, Math.min(TIME_LIMITS.MAX_MINUTES_PER_DAY, Math.round(r.minutes))),
  };

  return repaired;
}

/**
 * Validate and repair plan data
 */
export function validateAndRepairPlan(plan: unknown): PlanData | null {
  if (!plan || typeof plan !== "object") {
    return null;
  }

  const p = plan as Record<string, unknown>;

  // Check required fields
  if (typeof p.date !== "string" || !isValidDateString(p.date)) {
    logWarn("Invalid plan date, skipping:", p.date);
    return null;
  }

  if (typeof p.hours !== "number" || isNaN(p.hours)) {
    logWarn("Invalid plan hours, skipping:", p.hours);
    return null;
  }

  if (typeof p.minutes !== "number" || isNaN(p.minutes)) {
    logWarn("Invalid plan minutes, skipping:", p.minutes);
    return null;
  }

  // Repair invalid values
  const totalMinutes = Math.max(
    0,
    Math.min(
      TIME_LIMITS.MAX_MINUTES_PER_DAY,
      Math.round(p.hours) * 60 + Math.round(p.minutes)
    )
  );

  const repaired: PlanData = {
    date: p.date,
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };

  return repaired;
}

/**
 * Validate and repair an array of study records
 */
export function validateAndRepairRecords(records: unknown): StudyRecord[] {
  if (!Array.isArray(records)) {
    logWarn("Records is not an array, returning empty array");
    return [];
  }

  const repaired: StudyRecord[] = [];
  for (const record of records) {
    const validated = validateAndRepairRecord(record);
    if (validated) {
      repaired.push(validated);
    }
  }

  return repaired;
}

/**
 * Validate and repair an array of plan data
 */
export function validateAndRepairPlans(plans: unknown): PlanData[] {
  if (!Array.isArray(plans)) {
    logWarn("Plans is not an array, returning empty array");
    return [];
  }

  const repaired: PlanData[] = [];
  for (const plan of plans) {
    const validated = validateAndRepairPlan(plan);
    if (validated) {
      repaired.push(validated);
    }
  }

  return repaired;
}

/**
 * Check data integrity and return validation results
 */
export interface IntegrityCheckResult {
  isValid: boolean;
  errors: string[];
  repairedRecords: StudyRecord[];
  repairedPlans: PlanData[];
}

export function checkDataIntegrity(
  records: unknown,
  plans: unknown
): IntegrityCheckResult {
  const errors: string[] = [];
  let isValid = true;

  // Validate records
  if (!Array.isArray(records)) {
    errors.push("Records is not an array");
    isValid = false;
  }

  // Validate plans
  if (!Array.isArray(plans)) {
    errors.push("Plans is not an array");
    isValid = false;
  }

  // Repair data
  const repairedRecords = validateAndRepairRecords(records);
  const repairedPlans = validateAndRepairPlans(plans);

  // Check if repairs were needed
  if (Array.isArray(records) && repairedRecords.length !== records.length) {
    errors.push(`Repaired ${records.length - repairedRecords.length} invalid records`);
    isValid = false;
  }

  if (Array.isArray(plans) && repairedPlans.length !== plans.length) {
    errors.push(`Repaired ${plans.length - repairedPlans.length} invalid plans`);
    isValid = false;
  }

  return {
    isValid,
    errors,
    repairedRecords,
    repairedPlans,
  };
}

