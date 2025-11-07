"use client";

import { useState } from "react";
import type { StudyRecord, PlanData, CalendarCell } from "@/types";
import { formatDate, parseDate, isSameDay } from "@/lib/utils";
import { getAchievementColor, getColorClass } from "@/lib/colorMapping";
import { getDailyAchievement } from "@/lib/calculations";
import { fromMinutes } from "@/lib/utils";

interface CalendarGridProps {
  records: StudyRecord[];
  plans: PlanData[];
  currentDate: Date;
  onDateClick: (date: string) => void;
}

/**
 * CalendarGrid component - displays a monthly calendar with color-coded achievement cells
 */
export default function CalendarGrid({
  records,
  plans,
  currentDate,
  onDateClick,
}: CalendarGridProps) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Get previous month's last days for padding
  const prevMonth = new Date(year, month - 1, 0);
  const daysInPrevMonth = prevMonth.getDate();

  // Generate calendar cells
  const cells: CalendarCell[] = [];

  // Previous month's trailing days
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, daysInPrevMonth - i);
    const dateStr = formatDate(date);
    const achievement = getDailyAchievement(records, plans, dateStr);
    cells.push({
      date: dateStr,
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      isToday: isSameDay(date, today),
      achievementRate: achievement.achievementRate,
      plannedMinutes: achievement.plannedMinutes,
      actualMinutes: achievement.actualMinutes,
      color: getAchievementColor(achievement.achievementRate),
    });
  }

  // Current month's days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = formatDate(date);
    const achievement = getDailyAchievement(records, plans, dateStr);
    cells.push({
      date: dateStr,
      day,
      isCurrentMonth: true,
      isToday: isSameDay(date, today),
      achievementRate: achievement.achievementRate,
      plannedMinutes: achievement.plannedMinutes,
      actualMinutes: achievement.actualMinutes,
      color: getAchievementColor(achievement.achievementRate),
    });
  }

  // Next month's leading days
  const remainingCells = 42 - cells.length; // 6 weeks × 7 days
  for (let day = 1; day <= remainingCells; day++) {
    const date = new Date(year, month + 1, day);
    const dateStr = formatDate(date);
    const achievement = getDailyAchievement(records, plans, dateStr);
    cells.push({
      date: dateStr,
      day,
      isCurrentMonth: false,
      isToday: isSameDay(date, today),
      achievementRate: achievement.achievementRate,
      plannedMinutes: achievement.plannedMinutes,
      actualMinutes: achievement.actualMinutes,
      color: getAchievementColor(achievement.achievementRate),
    });
  }

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const getTooltipContent = (cell: CalendarCell) => {
    const planned = fromMinutes(cell.plannedMinutes);
    const actual = fromMinutes(cell.actualMinutes);
    return {
      date: parseDate(cell.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      planned: `${planned.hours}h ${planned.minutes}m`,
      actual: `${actual.hours}h ${actual.minutes}m`,
      rate: cell.achievementRate !== null ? `${cell.achievementRate}%` : "N/A",
    };
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Month Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-normal text-gray-800">
          {monthNames[month]} {year}
        </h2>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-gray-600 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Cells */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell) => {
            const tooltip = getTooltipContent(cell);
            const isHovered = hoveredDate === cell.date;

            return (
              <button
                key={cell.date}
                onClick={() => onDateClick(cell.date)}
                onMouseEnter={() => setHoveredDate(cell.date)}
                onMouseLeave={() => setHoveredDate(null)}
                className={`
                  relative aspect-square rounded-md border-2 transition-all duration-200
                  ${getColorClass(cell.color)}
                  ${!cell.isCurrentMonth ? "opacity-40" : ""}
                  ${cell.isToday ? "ring-2 ring-blue-500 ring-offset-1" : ""}
                  hover:shadow-md hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${isHovered ? "z-10" : ""}
                `}
                aria-label={`${cell.date}, Achievement: ${cell.achievementRate ?? "N/A"}%`}
                tabIndex={0}
              >
                <span
                  className={`text-sm font-medium ${
                    cell.color === "black" ? "text-white" : "text-gray-800"
                  }`}
                >
                  {cell.day}
                </span>

                {/* Tooltip */}
                {isHovered && (
                  <div
                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 
                               bg-gray-900 text-white text-xs rounded-md shadow-lg whitespace-nowrap z-20
                               pointer-events-none"
                    role="tooltip"
                  >
                    <div className="font-semibold mb-1">{tooltip.date}</div>
                    <div>Planned: {tooltip.planned}</div>
                    <div>Actual: {tooltip.actual}</div>
                    <div>Rate: {tooltip.rate}</div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

