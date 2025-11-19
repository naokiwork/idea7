"use client";

import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { StudyRecord, PlanData } from "@/types";
import { formatDate, getDatesInRange, getMonthStart, getWeekStart, parseDate } from "@/lib/utils";
import { getDailyAchievement } from "@/lib/calculations";
import { useLocale } from "@/context/LocaleContext";
import { downloadFile } from "@/lib/dataExport";

interface AchievementChartProps {
  records: StudyRecord[];
  plans: PlanData[];
  currentDate: Date;
}

type RangeType = "weekly" | "monthly" | "custom";

/**
 * AchievementChart component - displays achievement rate trends as a line chart
 */
export default function AchievementChart({
  records,
  plans,
  currentDate,
}: AchievementChartProps) {
  const { locale } = useLocale();
  const monthBounds = useMemo(() => {
    const start = getMonthStart(currentDate);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    return { start, end };
  }, [currentDate]);
  const monthStart = monthBounds.start;
  const monthEnd = monthBounds.end;

  const [rangeType, setRangeType] = useState<RangeType>("monthly");
  const [customFrom, setCustomFrom] = useState(formatDate(monthStart));
  const [customTo, setCustomTo] = useState(formatDate(monthEnd));
  const [appliedCustomRange, setAppliedCustomRange] = useState({
    from: formatDate(monthStart),
    to: formatDate(monthEnd),
  });
  const [customError, setCustomError] = useState<string | null>(null);
  const [showAchievement, setShowAchievement] = useState(true);
  const [showPlanned, setShowPlanned] = useState(true);
  const [showActual, setShowActual] = useState(true);

  const handleRangeChange = (nextRange: RangeType) => {
    setRangeType(nextRange);
    setCustomError(null);
  };

  const handleApplyCustomRange = () => {
    const fromDate = parseDate(customFrom);
    const toDate = parseDate(customTo);

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      setCustomError("Please select valid dates.");
      return;
    }

    if (fromDate > toDate) {
      setCustomError("Start date must be before end date.");
      return;
    }

    setAppliedCustomRange({ from: customFrom, to: customTo });
    setCustomError(null);
    setRangeType("custom");
  };

  const { rangeStart, rangeEnd, rangeLabel } = useMemo(() => {
    if (rangeType === "weekly") {
      const start = getWeekStart(currentDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return {
        rangeStart: start,
        rangeEnd: end,
        rangeLabel: `${start.toLocaleDateString(locale)} - ${end.toLocaleDateString(locale)}`,
      };
    }

    if (rangeType === "monthly") {
      return {
        rangeStart: monthStart,
        rangeEnd: monthEnd,
        rangeLabel: `${monthStart.toLocaleDateString(locale)} - ${monthEnd.toLocaleDateString(locale)}`,
      };
    }

    const fromDate = parseDate(appliedCustomRange.from);
    const toDate = parseDate(appliedCustomRange.to);
    const fallbackStart = monthStart;
    const fallbackEnd = monthEnd;

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || fromDate > toDate) {
      return {
        rangeStart: fallbackStart,
        rangeEnd: fallbackEnd,
        rangeLabel: `${fallbackStart.toLocaleDateString(locale)} - ${fallbackEnd.toLocaleDateString(locale)}`,
      };
    }

    return {
      rangeStart: fromDate,
      rangeEnd: toDate,
      rangeLabel: `${fromDate.toLocaleDateString(locale)} - ${toDate.toLocaleDateString(locale)}`,
    };
  }, [rangeType, currentDate, monthStart, monthEnd, appliedCustomRange, locale]);

  const chartData = useMemo(() => {
    const dates = getDatesInRange(rangeStart, rangeEnd);

    return dates.map((date) => {
      const achievement = getDailyAchievement(records, plans, date);
      const dateObj = new Date(date + "T00:00:00");
      return {
        date,
        label: dateObj.toLocaleDateString(locale, { month: "numeric", day: "numeric" }),
        achievement: achievement.achievementRate,
        planned: Math.round((achievement.plannedMinutes / 60) * 10) / 10,
        actual: Math.round((achievement.actualMinutes / 60) * 10) / 10,
      };
    });
  }, [records, plans, rangeStart, rangeEnd, locale]);

  const handleExportCsv = () => {
    if (chartData.length === 0) {
      return;
    }

    const header = ["date", "achievement_percent", "planned_hours", "actual_hours"];
    const rows = chartData.map((row) => [
      row.date,
      row.achievement ?? "",
      row.planned ?? "",
      row.actual ?? "",
    ]);

    const csv = [header, ...rows]
      .map((columns) => columns.map((value) => `${value}`).join(","))
      .join("\n");

    const filename = `achievement_trend_${appliedCustomRange.from}_to_${appliedCustomRange.to}.csv`;
    downloadFile(csv, filename, "text/csv");
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Achievement Trend</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{rangeLabel}</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
            <button
              type="button"
              onClick={() => handleRangeChange("weekly")}
              className={`px-3 py-1.5 text-sm font-medium rounded-l-lg transition-colors duration-200 ${
                rangeType === "weekly"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
              }`}
            >
              Weekly
            </button>
            <button
              type="button"
              onClick={() => handleRangeChange("monthly")}
              className={`px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
                rangeType === "monthly"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => handleRangeChange("custom")}
              className={`px-3 py-1.5 text-sm font-medium rounded-r-lg transition-colors duration-200 ${
                rangeType === "custom"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
              }`}
            >
              Custom
            </button>
          </div>

          {rangeType === "custom" && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <label htmlFor="chart-custom-from" className="text-xs text-gray-600 dark:text-gray-400">
                  From
                </label>
                <input
                  id="chart-custom-from"
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="chart-custom-to" className="text-xs text-gray-600 dark:text-gray-400">
                  To
                </label>
                <input
                  id="chart-custom-to"
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyCustomRange}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {customError && (
        <div className="mb-4 text-sm text-red-600 dark:text-red-400">
          {customError}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={showAchievement}
              onChange={() => setShowAchievement((prev) => !prev)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Achievement %
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={showPlanned}
              onChange={() => setShowPlanned((prev) => !prev)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Planned (h)
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={showActual}
              onChange={() => setShowActual((prev) => !prev)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Actual (h)
          </label>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={chartData.length === 0}
          className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Export CSV
        </button>
      </div>

      <div className="space-y-10">
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Achievement Rate (%)</h4>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
              <XAxis
                dataKey="label"
                className="text-gray-600 dark:text-gray-400"
                tick={{ fill: "currentColor" }}
              />
              <YAxis
                className="text-gray-600 dark:text-gray-400"
                tick={{ fill: "currentColor" }}
                domain={[0, "auto"]}
                tickFormatter={(value: number) => `${Math.round(value)}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgb(255, 255, 255)",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.5rem",
                }}
                labelStyle={{ color: "#374151" }}
                formatter={(value: number) => [`${value}%`, "Achievement"]}
                wrapperStyle={{ filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))" }}
              />
              <Legend />
              {showAchievement && (
                <Line
                  type="monotone"
                  dataKey="achievement"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Achievement %"
                  dot={{ r: 4 }}
                  activeDot={{ r: 5 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Planned vs Actual (hours)</h4>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
              <XAxis
                dataKey="label"
                className="text-gray-600 dark:text-gray-400"
                tick={{ fill: "currentColor" }}
              />
              <YAxis
                className="text-gray-600 dark:text-gray-400"
                tick={{ fill: "currentColor" }}
                domain={[0, "auto"]}
                tickFormatter={(value: number) => `${value}h`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgb(255, 255, 255)",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.5rem",
                }}
                labelStyle={{ color: "#374151" }}
                formatter={(value: number, name) => {
                  const label = name === "planned" ? "Planned" : "Actual";
                  return [`${value} h`, label];
                }}
                wrapperStyle={{ filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))" }}
              />
              <Legend />
              {showPlanned && (
                <Line
                  type="monotone"
                  dataKey="planned"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Planned"
                  dot={{ r: 4 }}
                  activeDot={{ r: 5 }}
                />
              )}
              {showActual && (
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Actual"
                  dot={{ r: 4 }}
                  activeDot={{ r: 5 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

