"use client";

import { useState, useMemo } from "react";
import type { StudyRecord, PlanData, CalendarCell } from "@/types";
import { formatDate, parseDate, isSameDay } from "@/lib/utils";
import { getAchievementColor, getColorClass, getColorStyle, getTextColorClass } from "@/lib/colorMapping";
import { getDailyAchievement } from "@/lib/calculations";
import { fromMinutes } from "@/lib/utils";
import { useLocale } from "@/context/LocaleContext";
import type { ColorThemeOption } from "@/types";
import { CALENDAR_CONFIG } from "@/lib/constants";

interface CalendarGridProps {
  records: StudyRecord[];
  plans: PlanData[];
  currentDate: Date;
  onDateClick: (date: string) => void;
  colorTheme: ColorThemeOption;
}

/**
 * CalendarGrid component - displays a monthly calendar with color-coded achievement cells
 */
export default function CalendarGrid({
  records,
  plans,
  currentDate,
  onDateClick,
  colorTheme,
}: CalendarGridProps) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const { locale } = useLocale();

  // Extract year and month from currentDate (needed outside useMemo for header)
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Memoize calendar cells to avoid recalculation on every render
  const cells = useMemo(() => {
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
    const calendarCells: CalendarCell[] = [];

    // Previous month's trailing days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, daysInPrevMonth - i);
      const dateStr = formatDate(date);
      const achievement = getDailyAchievement(records, plans, dateStr);
      calendarCells.push({
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
      calendarCells.push({
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
    const remainingCells = CALENDAR_CONFIG.TOTAL_CELLS - calendarCells.length;
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      const dateStr = formatDate(date);
      const achievement = getDailyAchievement(records, plans, dateStr);
      calendarCells.push({
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

    return calendarCells;
  }, [records, plans, month, year]);

  const weekDays = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
    const base = new Date(Date.UTC(2021, 5, 6)); // Sunday
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(base);
      date.setDate(base.getDate() + index);
      return formatter.format(date);
    });
  }, [locale]);

  const monthNames = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { month: "long" });
    return Array.from({ length: 12 }, (_, index) => formatter.format(new Date(2021, index, 1)));
  }, [locale]);

  const getTooltipContent = (cell: CalendarCell) => {
    const planned = fromMinutes(cell.plannedMinutes);
    const actual = fromMinutes(cell.actualMinutes);
    const formatter = new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return {
      date: formatter.format(parseDate(cell.date)),
      planned: `${planned.hours}h ${planned.minutes}m`,
      actual: `${actual.hours}h ${actual.minutes}m`,
      rate: cell.achievementRate !== null ? `${cell.achievementRate}%` : "N/A",
    };
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Month Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-normal text-gray-800 dark:text-gray-200">
          {monthNames[month]} {year}
        </h2>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-gray-600 dark:text-gray-400 py-2"
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
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onDateClick(cell.date);
                  }
                }}
                className={`
                  relative aspect-square rounded-md transition-all duration-200
                  ${getColorClass(cell.color, colorTheme, cell.achievementRate)}
                  ${!cell.isCurrentMonth ? "opacity-50" : ""}
                  ${cell.isToday ? "ring-2 ring-blue-500 ring-offset-1" : ""}
                  hover:shadow-md hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${isHovered ? "z-10" : ""}
                `}
                style={getColorStyle(cell.color, colorTheme, cell.achievementRate)}
                aria-label={`${cell.date}, Achievement: ${cell.achievementRate ?? "N/A"}%, Planned: ${Math.floor(cell.plannedMinutes / 60)}h ${cell.plannedMinutes % 60}m, Actual: ${Math.floor(cell.actualMinutes / 60)}h ${cell.actualMinutes % 60}m`}
                aria-pressed={false}
                tabIndex={0}
              >
                <span className={`text-sm font-bold ${getTextColorClass(cell.color, colorTheme, cell.achievementRate)}`}>
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

