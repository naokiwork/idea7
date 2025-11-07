/**
 * Calculation utilities for study time and achievement rates
 */

import type { StudyRecord, PlanData, AchievementData, DateRange } from "@/types";
import { formatDate, parseDate, getWeekStart, getMonthStart, getYearStart, getDatesInRange, toMinutes } from "./utils";

/**
 * Calculate achievement rate percentage
 */
export function calculateAchievementRate(planned: number, actual: number): number {
  if (planned === 0) return actual > 0 ? 100 : 0;
  return Math.round((actual / planned) * 100);
}

/**
 * Get total minutes for a date from records
 */
export function getTotalMinutesForDate(records: StudyRecord[], date: string): number {
  return records
    .filter((r) => r.date === date)
    .reduce((sum, r) => sum + r.minutes, 0);
}

/**
 * Get planned minutes for a date
 */
export function getPlannedMinutesForDate(plans: PlanData[], date: string): number {
  const plan = plans.find((p) => p.date === date);
  return plan ? toMinutes(plan.hours, plan.minutes) : 0;
}

/**
 * Calculate daily achievement data
 */
export function getDailyAchievement(
  records: StudyRecord[],
  plans: PlanData[],
  date: string
): AchievementData {
  const plannedMinutes = getPlannedMinutesForDate(plans, date);
  const actualMinutes = getTotalMinutesForDate(records, date);
  const achievementRate = calculateAchievementRate(plannedMinutes, actualMinutes);

  return {
    date,
    plannedMinutes,
    actualMinutes,
    achievementRate,
  };
}

/**
 * Calculate weekly totals and achievement
 */
export function getWeeklyStats(
  records: StudyRecord[],
  plans: PlanData[],
  date: Date
): { planned: number; actual: number; achievementRate: number } {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const weekDates = getDatesInRange(weekStart, weekEnd);

  const planned = weekDates.reduce(
    (sum, d) => sum + getPlannedMinutesForDate(plans, d),
    0
  );
  const actual = weekDates.reduce(
    (sum, d) => sum + getTotalMinutesForDate(records, d),
    0
  );
  const achievementRate = calculateAchievementRate(planned, actual);

  return { planned, actual, achievementRate };
}

/**
 * Calculate monthly totals and achievement
 */
export function getMonthlyStats(
  records: StudyRecord[],
  plans: PlanData[],
  date: Date
): { planned: number; actual: number; achievementRate: number } {
  const monthStart = getMonthStart(date);
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const monthDates = getDatesInRange(monthStart, monthEnd);

  const planned = monthDates.reduce(
    (sum, d) => sum + getPlannedMinutesForDate(plans, d),
    0
  );
  const actual = monthDates.reduce(
    (sum, d) => sum + getTotalMinutesForDate(records, d),
    0
  );
  const achievementRate = calculateAchievementRate(planned, actual);

  return { planned, actual, achievementRate };
}

/**
 * Calculate yearly totals and achievement
 */
export function getYearlyStats(
  records: StudyRecord[],
  plans: PlanData[],
  date: Date
): { planned: number; actual: number; achievementRate: number } {
  const yearStart = getYearStart(date);
  const yearEnd = new Date(date.getFullYear(), 11, 31);

  const yearDates = getDatesInRange(yearStart, yearEnd);

  const planned = yearDates.reduce(
    (sum, d) => sum + getPlannedMinutesForDate(plans, d),
    0
  );
  const actual = yearDates.reduce(
    (sum, d) => sum + getTotalMinutesForDate(records, d),
    0
  );
  const achievementRate = calculateAchievementRate(planned, actual);

  return { planned, actual, achievementRate };
}

/**
 * Calculate custom period totals and achievement
 */
export function getCustomPeriodStats(
  records: StudyRecord[],
  plans: PlanData[],
  range: DateRange
): { planned: number; actual: number; achievementRate: number } {
  const fromDate = parseDate(range.from);
  const toDate = parseDate(range.to);

  const periodDates = getDatesInRange(fromDate, toDate);

  const planned = periodDates.reduce(
    (sum, d) => sum + getPlannedMinutesForDate(plans, d),
    0
  );
  const actual = periodDates.reduce(
    (sum, d) => sum + getTotalMinutesForDate(records, d),
    0
  );
  const achievementRate = calculateAchievementRate(planned, actual);

  return { planned, actual, achievementRate };
}

