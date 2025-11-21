"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import type { StudyRecord, PlanData, ColorThemeOption, StudySession } from "@/types";
import { fromMinutes, parseDate, formatDate } from "@/lib/utils";
import { getDailyAchievement } from "@/lib/calculations";
import { getAchievementColor, getColorClass, getColorStyle, getTextColorClass } from "@/lib/colorMapping";
import EditRecordModal from "./EditRecordModal";
import ConfirmDialog from "./ConfirmDialog";
import { useLocale } from "@/context/LocaleContext";
import { RING_ANIMATION } from "@/lib/constants";

interface TodayViewProps {
  records: StudyRecord[];
  plans: PlanData[];
  editLogs: StudySession[];
  onDuplicatePlan: (date: string) => void;
  onClearHistory: (date: string) => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onNavigateDay: (direction: "prev" | "next") => void;
  onEditPlan: (date: string) => void;
  onDeletePlan: (date: string) => void;
  onAddRecord: (date: string) => void;
  onEditRecord: (date: string, minutes: number) => void;
  onDeleteRecord: (date: string) => void;
  colorTheme: ColorThemeOption;
}

/**
 * TodayView component - displays today's study data in a focused view
 */
export default function TodayView({
  records,
  plans,
  editLogs,
  onDuplicatePlan,
  onClearHistory,
  selectedDate,
  onSelectDate,
  onNavigateDay,
  onEditPlan,
  onDeletePlan,
  onAddRecord,
  onEditRecord,
  onDeleteRecord,
  colorTheme,
}: TodayViewProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { locale } = useLocale();
  const [ringState, setRingState] = useState<"idle" | "sweeping" | "flash">("idle");
  const sweepStartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sweepEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestLogTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    setShowHistory(false);
  }, [selectedDate]);

  const selectedDateObj = useMemo(() => {
    const parsed = parseDate(selectedDate);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [selectedDate]);

  const achievement = getDailyAchievement(records, plans, selectedDate);
  const planned = fromMinutes(achievement.plannedMinutes);
  const actual = fromMinutes(achievement.actualMinutes);
  const color = getAchievementColor(achievement.achievementRate);

  const selectedPlan = plans.find((p) => p.date === selectedDate);
  const selectedRecord = records.find((r) => r.date === selectedDate);

  const dayLogs = useMemo(
    () =>
      editLogs
        .filter((log) => log.date === selectedDate)
        .sort(
          (a, b) =>
            new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
        ),
    [editLogs, selectedDate]
  );

  const historyWindowDates = useMemo(() => {
    return Array.from({ length: 3 }, (_, index) => {
      const date = new Date(selectedDateObj);
      date.setDate(date.getDate() - index);
      return formatDate(date);
    });
  }, [selectedDateObj]);

  const clearRingTimers = useCallback(() => {
    if (sweepStartTimeoutRef.current) {
      clearTimeout(sweepStartTimeoutRef.current);
      sweepStartTimeoutRef.current = null;
    }
    if (sweepEndTimeoutRef.current) {
      clearTimeout(sweepEndTimeoutRef.current);
      sweepEndTimeoutRef.current = null;
    }
    if (flashTimeoutRef.current) {
      clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = null;
    }
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearRingTimers();
    };
  }, [clearRingTimers]);

  useEffect(() => {
    if (dayLogs.length === 0) {
      return;
    }
    const latestLog = dayLogs[dayLogs.length - 1];
    const latestLogTime = new Date(latestLog.recordedAt).getTime();
    if (!Number.isFinite(latestLogTime)) {
      return;
    }
    if (
      latestLogTimestampRef.current !== null &&
      latestLogTime <= latestLogTimestampRef.current
    ) {
      return;
    }
    latestLogTimestampRef.current = latestLogTime;
    clearRingTimers();
    setRingState("idle");

    sweepStartTimeoutRef.current = setTimeout(() => {
      setRingState("sweeping");
      sweepEndTimeoutRef.current = setTimeout(() => {
        setRingState("idle");
        flashTimeoutRef.current = setTimeout(() => {
          setRingState("flash");
          resetTimeoutRef.current = setTimeout(() => {
            setRingState("idle");
          }, RING_ANIMATION.FLASH_DURATION);
        }, RING_ANIMATION.FLASH_DELAY);
      }, RING_ANIMATION.SWEEP_DURATION);
    }, RING_ANIMATION.SWEEP_DELAY);

    return () => {
      clearRingTimers();
    };
  }, [dayLogs, clearRingTimers]);

  useEffect(() => {
    latestLogTimestampRef.current = null;
    clearRingTimers();
    setRingState("idle");
  }, [selectedDate, clearRingTimers]);

  const recentLogsByDate = useMemo(() => {
    const buckets = new Map<string, { plan: StudySession[]; actual: StudySession[] }>();
    historyWindowDates.forEach((date) => {
      buckets.set(date, { plan: [], actual: [] });
    });
    editLogs.forEach((log) => {
      if (!buckets.has(log.date)) return;
      const bucket = buckets.get(log.date);
      if (!bucket) return;
      if (log.kind === "plan") {
        bucket.plan.push(log);
      } else {
        bucket.actual.push(log);
      }
    });
    historyWindowDates.forEach((date) => {
      const bucket = buckets.get(date);
      if (!bucket) return;
      const sorter = (a: StudySession, b: StudySession) =>
        new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime();
      bucket.plan.sort(sorter);
      bucket.actual.sort(sorter);
    });
    return buckets;
  }, [editLogs, historyWindowDates]);

  const formatTimestamp = useCallback(
    (iso: string) =>
      new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(iso)),
    [locale]
  );

  const formatMinutes = useCallback((minutes: number) => {
    const duration = fromMinutes(minutes);
    return `${duration.hours}h ${duration.minutes}m`;
  }, []);

  const handleOpenPlanEditor = useCallback(() => {
    setShowHistory(false);
    onEditPlan(selectedDate);
  }, [onEditPlan, selectedDate]);

  const handleOpenRecordModal = useCallback(() => {
    setShowHistory(false);
    onAddRecord(selectedDate);
  }, [onAddRecord, selectedDate]);

  const handleDuplicatePlan = useCallback(() => {
    setShowHistory(false);
    onDuplicatePlan(selectedDate);
  }, [onDuplicatePlan, selectedDate]);

  const handleDeletePlanFromHistory = useCallback(() => {
    setShowHistory(false);
    onDeletePlan(selectedDate);
  }, [onDeletePlan, selectedDate]);

  const handleDeleteRecordFromHistory = useCallback(() => {
    setShowHistory(false);
    onDeleteRecord(selectedDate);
  }, [onDeleteRecord, selectedDate]);

  const handleClearHistory = useCallback(() => {
    onClearHistory(selectedDate);
    setShowHistory(false);
  }, [onClearHistory, selectedDate]);

  const handleDateInputChange = (value: string) => {
    if (!value) return;
    onSelectDate(value);
  };

  const handlePrevDay = () => {
    onNavigateDay("prev");
  };

  const handleNextDay = () => {
    onNavigateDay("next");
  };

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  const handleEditSave = (hours: number, minutes: number) => {
    onEditRecord(selectedDate, hours * 60 + minutes);
    setShowEditModal(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    onDeleteRecord(selectedDate);
    setShowDeleteConfirm(false);
  };

  const formattedDate = selectedDateObj.toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header with navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200
                       hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Previous day"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 text-center min-w-[220px]">
            <h1 className="text-3xl font-normal text-gray-800 dark:text-gray-200">Selected Day</h1>
            <p className="text-gray-600 dark:text-gray-400">{formattedDate}</p>
          </div>
          <button
            onClick={handleNextDay}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200
                       hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Next day"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="w-full sm:w-auto">
          <label
            htmlFor="selected-date-input"
            className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 text-center sm:text-left"
          >
            Choose a date
          </label>
          <input
            id="selected-date-input"
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateInputChange(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       transition-shadow duration-200"
            aria-label="Select date"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          onClick={() => onAddRecord(selectedDate)}
          className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 font-medium shadow-sm"
        >
          + Record Study Time
        </button>
        <button
          onClick={() => setShowHistory(true)}
          className="w-full sm:w-auto px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 font-medium shadow-sm"
        >
          View Edit History
        </button>
      </div>

      {/* Achievement Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center mb-6">
          <div
            className={`achievement-ring inline-flex items-center justify-center w-32 h-32 rounded-full border-4 overflow-visible ${getColorClass(
              color,
              colorTheme,
              achievement.achievementRate
            )} mb-4`}
            style={getColorStyle(color, colorTheme, achievement.achievementRate)}
          >
            {ringState === "sweeping" && (
              <span className="achievement-ring__sweep" aria-hidden="true" />
            )}
            {ringState === "flash" && (
              <span className="achievement-ring__flash" aria-hidden="true" />
            )}
            <span
              className={`text-4xl font-bold ${getTextColorClass(color, colorTheme, achievement.achievementRate)}`}
            >
              {achievement.achievementRate}%
            </span>
          </div>
          <h2 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">
            Achievement Rate
          </h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Planned</div>
            <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              {planned.hours}h {planned.minutes}m
            </div>
            {selectedPlan && (
              <button
                onClick={() => onEditPlan(selectedDate)}
                className="mt-2 text-xs text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                aria-label="Edit plan"
              >
                Edit
              </button>
            )}
            {selectedPlan && (
              <button
                onClick={() => onDeletePlan(selectedDate)}
                className="mt-2 ml-2 text-xs text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1"
                aria-label="Delete plan"
              >
                Delete
              </button>
            )}
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Actual</div>
            <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              {actual.hours}h {actual.minutes}m
            </div>
            {selectedRecord && (
              <div className="mt-2 flex gap-2 justify-center">
                <button
                  onClick={handleEditClick}
                  className="text-xs text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                  aria-label="Edit record"
                >
                  Edit
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="text-xs text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1"
                  aria-label="Delete record"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!selectedPlan && (
            <button
              onClick={() => onEditPlan(selectedDate)}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg 
                         hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
                         transition-colors duration-200 font-medium"
              aria-label="Set plan for selected day"
            >
              Set Plan
            </button>
          )}
          <button
            onClick={() => onAddRecord(selectedDate)}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg 
                       hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 
                       transition-colors duration-200 font-medium"
            aria-label="Record study time for selected day"
          >
            + Record Study
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Day Details</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400">Planned Time</span>
            <span className="text-gray-800 dark:text-gray-200 font-medium">
              {planned.hours}h {planned.minutes}m
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400">Actual Time</span>
            <span className="text-gray-800 dark:text-gray-200 font-medium">
              {actual.hours}h {actual.minutes}m
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600 dark:text-gray-400">Achievement</span>
            <span
              className={`text-lg font-semibold ${
                color === "black" || color === "brown"
                  ? "text-amber-700"
                  : color === "white"
                  ? "text-gray-600"
                  : color === "yellow"
                  ? "text-yellow-700"
                  : color === "green"
                  ? "text-green-700"
                  : color === "purple"
                  ? "text-purple-700"
                  : "text-gray-600"
              }`}
            >
              {achievement.achievementRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {achievement.plannedMinutes > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {Math.min(achievement.achievementRate, 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                color === "black"
                  ? "bg-gray-900"
                  : color === "brown"
                  ? "bg-amber-700"
                  : color === "yellow"
                  ? "bg-yellow-400"
                  : color === "green"
                  ? "bg-green-400"
                  : color === "purple"
                  ? "bg-purple-400"
                  : color === "white"
                  ? "bg-gray-400"
                  : "bg-gray-400"
              }`}
              style={{
                width: `${Math.min(achievement.achievementRate, 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {showHistory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
          onClick={() => setShowHistory(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl p-6 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Edit History</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{formattedDate}</p>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="self-start px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 space-y-3">
                <div className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wide">
                  Plan
                </div>
                <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {formatMinutes(achievement.plannedMinutes)}
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    onClick={handleOpenPlanEditor}
                    className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDuplicatePlan}
                    className="px-3 py-1.5 text-sm rounded-md border border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Duplicate Previous
                  </button>
                  {selectedPlan && (
                    <button
                      onClick={handleDeletePlanFromHistory}
                      className="px-3 py-1.5 text-sm rounded-md border border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              <div className="rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 space-y-3">
                <div className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wide">
                  Actual
                </div>
                <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {formatMinutes(achievement.actualMinutes)}
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    onClick={handleOpenRecordModal}
                    className="px-3 py-1.5 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Edit
                  </button>
                  {selectedRecord && (
                    <button
                      onClick={handleDeleteRecordFromHistory}
                      className="px-3 py-1.5 text-sm rounded-md border border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6 max-h-[24rem] overflow-y-auto pr-2">
              {historyWindowDates.map((date) => {
                const bucket = recentLogsByDate.get(date);
                const planEntries = bucket?.plan ?? [];
                const actualEntries = bucket?.actual ?? [];
                const targetDate = parseDate(date);
                const dateLabel = Number.isNaN(targetDate.getTime())
                  ? date
                  : targetDate.toLocaleDateString(locale, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      weekday: "long",
                    });
                const isSelected = date === selectedDate;

                return (
                  <section key={date} className="space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                        {dateLabel}
                      </h3>
                      {isSelected && (
                        <p className="text-xs text-blue-600 dark:text-blue-300">Selected day</p>
                      )}
                    </div>
                    {planEntries.length === 0 && actualEntries.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No edits recorded for this day.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            Actual Adjustments
                          </h4>
                          {actualEntries.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              No actual time edits recorded.
                            </p>
                          ) : (
                            <ul className="space-y-2">
                              {actualEntries.map((log) => {
                                const delta = log.minutes - log.previousMinutes;
                                const deltaLabel =
                                  delta === 0
                                    ? "No change"
                                    : `${delta > 0 ? "+" : "-"}${formatMinutes(Math.abs(delta))}`;
                                return (
                                  <li
                                    key={log.id}
                                    className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
                                  >
                                    <div>
                                      <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                        {formatTimestamp(log.recordedAt)}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatMinutes(log.previousMinutes)} → {formatMinutes(log.minutes)}
                                      </div>
                                      {log.source && (
                                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                          {log.source}
                                        </div>
                                      )}
                                    </div>
                                    <span
                                      className={`text-xs font-semibold ${
                                        delta > 0
                                          ? "text-emerald-600"
                                          : delta < 0
                                          ? "text-red-500"
                                          : "text-gray-500"
                                      }`}
                                    >
                                      {deltaLabel}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide text-right md:text-left md:justify-self-end">
                            Plan Adjustments
                          </h4>
                          {planEntries.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              No plan edits recorded.
                            </p>
                          ) : (
                            <ul className="space-y-2">
                              {planEntries.map((log) => {
                                const delta = log.minutes - log.previousMinutes;
                                const deltaLabel =
                                  delta === 0
                                    ? "No change"
                                    : `${delta > 0 ? "+" : "-"}${formatMinutes(Math.abs(delta))}`;
                                return (
                                  <li
                                    key={log.id}
                                    className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
                                  >
                                    <div>
                                      <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                        {formatTimestamp(log.recordedAt)}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatMinutes(log.previousMinutes)} → {formatMinutes(log.minutes)}
                                      </div>
                                      {log.source && (
                                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                          {log.source}
                                        </div>
                                      )}
                                    </div>
                                    <span
                                      className={`text-xs font-semibold ${
                                        delta > 0
                                          ? "text-emerald-600"
                                          : delta < 0
                                          ? "text-red-500"
                                          : "text-gray-500"
                                      }`}
                                    >
                                      {deltaLabel}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleClearHistory}
                className="px-4 py-2 text-sm font-medium rounded-md border border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Record Modal */}
      {showEditModal && selectedRecord && (
        <EditRecordModal
          date={selectedDate}
          initialHours={Math.floor(selectedRecord.minutes / 60)}
          initialMinutes={selectedRecord.minutes % 60}
          onSave={handleEditSave}
          onCancel={() => setShowEditModal(false)}
        />
      )}

      {/* Delete Confirm Dialog */}
      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Study Record"
          message="Are you sure you want to delete today's study record? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}

