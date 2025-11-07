"use client";

import { useState } from "react";
import type { StudyRecord, PlanData, DateRange } from "@/types";
import { formatDate, parseDate, fromMinutes } from "@/lib/utils";
import {
  getDailyAchievement,
  getWeeklyStats,
  getMonthlyStats,
  getYearlyStats,
  getCustomPeriodStats,
} from "@/lib/calculations";

interface AchievementStatsProps {
  records: StudyRecord[];
  plans: PlanData[];
  currentDate: Date;
}

/**
 * AchievementStats component - displays achievement percentages for different time periods
 */
export default function AchievementStats({
  records,
  plans,
  currentDate,
}: AchievementStatsProps) {
  const [showCustomPeriod, setShowCustomPeriod] = useState(false);
  const [customFrom, setCustomFrom] = useState(formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)));
  const [customTo, setCustomTo] = useState(formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)));

  const daily = getDailyAchievement(records, plans, formatDate(currentDate));
  const weekly = getWeeklyStats(records, plans, currentDate);
  const monthly = getMonthlyStats(records, plans, currentDate);
  const yearly = getYearlyStats(records, plans, currentDate);

  const customPeriod: DateRange = { from: customFrom, to: customTo };
  const custom = getCustomPeriodStats(records, plans, customPeriod);

  const formatTime = (minutes: number) => {
    const { hours, minutes: mins } = fromMinutes(minutes);
    return `${hours}h ${mins}m`;
  };

  const StatCard = ({
    title,
    planned,
    actual,
    rate,
  }: {
    title: string;
    planned: number;
    actual: number;
    rate: number;
  }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <h4 className="text-sm font-medium text-gray-600 mb-3">{title}</h4>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Planned:</span>
          <span className="text-gray-800 font-medium">{formatTime(planned)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Actual:</span>
          <span className="text-gray-800 font-medium">{formatTime(actual)}</span>
        </div>
        <div className="pt-2 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Achievement:</span>
            <span
              className={`text-lg font-semibold ${
                rate >= 100 ? "text-green-600" : rate >= 80 ? "text-blue-600" : "text-gray-600"
              }`}
            >
              {rate}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <h2 className="text-xl font-normal text-gray-800 mb-4">Achievement Statistics</h2>

      {/* Standard Period Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today"
          planned={daily.plannedMinutes}
          actual={daily.actualMinutes}
          rate={daily.achievementRate}
        />
        <StatCard
          title="This Week"
          planned={weekly.planned}
          actual={weekly.actual}
          rate={weekly.achievementRate}
        />
        <StatCard
          title="This Month"
          planned={monthly.planned}
          actual={monthly.actual}
          rate={monthly.achievementRate}
        />
        <StatCard
          title="This Year"
          planned={yearly.planned}
          actual={yearly.actual}
          rate={yearly.achievementRate}
        />
      </div>

      {/* Custom Period */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-700">Custom Period</h4>
          <button
            onClick={() => setShowCustomPeriod(!showCustomPeriod)}
            className="text-sm text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            aria-expanded={showCustomPeriod}
            aria-label="Toggle custom period input"
          >
            {showCustomPeriod ? "Hide" : "Show"}
          </button>
        </div>

        {showCustomPeriod && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label
                  htmlFor="custom-from"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  From
                </label>
                <input
                  type="date"
                  id="custom-from"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             transition-shadow duration-200"
                  aria-label="Custom period start date"
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="custom-to"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  To
                </label>
                <input
                  type="date"
                  id="custom-to"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             transition-shadow duration-200"
                  aria-label="Custom period end date"
                />
              </div>
            </div>
            <StatCard
              title={`Custom Period (${parseDate(customFrom).toLocaleDateString()} - ${parseDate(customTo).toLocaleDateString()})`}
              planned={custom.planned}
              actual={custom.actual}
              rate={custom.achievementRate}
            />
          </div>
        )}
      </div>
    </div>
  );
}

