"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import type { StudyRecord, PlanData, ColorThemeOption, StudySession } from "@/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { formatDate, generateId, toMinutes } from "@/lib/utils";
import { validatePlanData, validateStudyRecord, sanitizePlanData, sanitizeStudyRecord } from "@/lib/validation";
import CalendarGrid from "@/components/CalendarGrid";
import PlanInputForm from "@/components/PlanInputForm";
import RecordModal from "@/components/RecordModal";
import AchievementStats from "@/components/AchievementStats";
import TodayView from "@/components/TodayView";
import DataExportImport from "@/components/DataExportImport";
import BulkOperationModal from "@/components/BulkOperationModal";
import AchievementChart from "@/components/AchievementChart";
import NotificationSettings from "@/components/NotificationSettings";
import DarkModeToggle from "@/components/DarkModeToggle";
import BulkRecordAdd from "@/components/BulkRecordAdd";
import BackupManager from "@/components/BackupManager";
import { LocaleProvider } from "@/context/LocaleContext";
import { useBackupsManager } from "@/hooks/useBackupsManager";
import SheetView from "@/components/SheetView";
import ConfirmDialog from "@/components/ConfirmDialog";
import { STORAGE_KEYS, TIME_LIMITS } from "@/lib/constants";
import { logError } from "@/lib/logger";

type ViewMode = "calendar" | "today" | "sheet";

const COLOR_THEME_OPTIONS: Array<{
  value: ColorThemeOption;
  title: string;
  description: string;
  icon: string;
}> = [
  {
    value: "classic",
    title: "Classic",
    description: "Multi-color palette based on achievement bands.",
    icon:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iNyIgaGVpZ2h0PSI3IiByeD0iMS41IiBmaWxsPSIjOGM0M2YxIi8+PHJlY3QgeD0iMTQiIHk9IjMiIHdpZHRoPSI3IiBoZWlnaHQ9IjciIHJ4PSIxLjUiIGZpbGw9IiNmOGIxNTYiLz48cmVjdCB4PSIzIiB5PSIxNCIgd2lkdGg9IjciIGhlaWdodD0iNyIgcng9IjEuNSIgZmlsbD0iIzQ5ZjU2MyIvPjxyZWN0IHg9IjE0IiB5PSIxNCIgd2lkdGg9IjciIGhlaWdodD0iNyIgcng9IjEuNSIgZmlsbD0iIzQ0NTQ2YyIvPjwvc3ZnPg==",
  },
  {
    value: "github-green",
    title: "GitHub",
    description: "Green intensity increases with higher achievement.",
    icon:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB4PSIzIiB5PSI0IiB3aWR0aD0iMTgiIGhlaWdodD0iMyIgcng9IjEuNSIgZmlsbD0iIzEzMjQyYSIvPjxyZWN0IHg9IjMiIHk9IjkiIHdpZHRoPSIxOCIgaGVpZ2h0PSIzIiByeD0iMS41IiBmaWxsPSIjMTYzMjhiIi8+PHJlY3QgeD0iMyIgeT0iMTQiIHdpZHRoPSIxOCIgaGVpZ2h0PSIzIiByeD0iMS41IiBmaWxsPSIjMjBiM2U0Ii8+PHJlY3QgeD0iMyIgeT0iMTkiIHdpZHRoPSIxOCIgaGVpZ2h0PSIzIiByeD0iMS41IiBmaWxsPSIjMjJjYTk5Ii8+PC9zdmc+",
  },
];

function generateSampleData(referenceDate: Date = new Date()): { plans: PlanData[]; records: StudyRecord[] } {
  const planMap = new Map<string, PlanData>();
  const recordMap = new Map<string, StudyRecord>();

  for (let offset = -15; offset < 15; offset++) {
    const date = new Date(referenceDate);
    date.setDate(referenceDate.getDate() + offset);
    if (date.getMonth() !== referenceDate.getMonth()) {
      continue;
    }
    const dateKey = formatDate(date);
    planMap.set(dateKey, {
      date: dateKey,
      hours: Math.floor(Math.random() * 3) + 1,
      minutes: Math.floor(Math.random() * 60),
    });
  }

  for (let offset = -10; offset < 10; offset++) {
    const date = new Date(referenceDate);
    date.setDate(referenceDate.getDate() + offset);
    if (Math.random() <= 0.3) {
      continue;
    }
    const dateKey = formatDate(date);
    const currentMinutes = recordMap.get(dateKey)?.minutes ?? 0;
    const additionalMinutes = Math.floor(Math.random() * 180) + 30;
    recordMap.set(dateKey, {
      date: dateKey,
      minutes: Math.min(currentMinutes + additionalMinutes, 24 * 60),
    });
  }

  return {
    plans: Array.from(planMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
    records: Array.from(recordMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
  };
}

/**
 * Main page component - Study Hour Calendar application
 * Integrates all components with Google-style minimalist UI
 * Uses localStorage for data persistence (no backend required)
 */
export default function Home() {
  const [records, setRecords] = useLocalStorage<StudyRecord[]>(STORAGE_KEYS.RECORDS, []);
  const [plans, setPlans] = useLocalStorage<PlanData[]>(STORAGE_KEYS.PLANS, []);
  const [error, setError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>(STORAGE_KEYS.VIEW_MODE, "calendar");
  const [colorTheme, setColorTheme] = useLocalStorage<ColorThemeOption>(STORAGE_KEYS.COLOR_THEME, "classic");
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBulkRecordAdd, setShowBulkRecordAdd] = useState(false);
  const [dailyViewDate, setDailyViewDate] = useLocalStorage<string>(
    STORAGE_KEYS.DAILY_VIEW_DATE,
    formatDate(new Date())
  );
  const [locale, setLocale] = useLocalStorage<string>(
    STORAGE_KEYS.LOCALE,
    typeof navigator !== "undefined" ? navigator.language : "en-US"
  );
  const [sessions, setSessions] = useLocalStorage<StudySession[]>(STORAGE_KEYS.SESSIONS, []);
  const sessionsRef = useRef(sessions);
  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  const {
    backups,
    restoreContext,
    createBackupSnapshot,
    backupNow,
    deleteBackupById,
    deleteAllBackups,
    restoreBackup,
    undoRestore,
    dismissRestoreBanner,
  } = useBackupsManager({ records, plans, sessions, setRecords, setPlans, setSessions, setError });

  const recordsIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    records.forEach((record, index) => {
      map.set(record.date, index);
    });
    return map;
  }, [records]);

  const plansIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    plans.forEach((plan, index) => {
      map.set(plan.date, index);
    });
    return map;
  }, [plans]);

  // Load example data on first mount (for preview)
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const hasInitialized = window.localStorage.getItem(STORAGE_KEYS.SAMPLE_DATA_LOADED) === "true";

    if (!hasInitialized && records.length === 0 && plans.length === 0) {
      const { plans: samplePlans, records: sampleRecords } = generateSampleData(new Date());
      setPlans(samplePlans);
      setRecords(sampleRecords);
      window.localStorage.setItem(STORAGE_KEYS.SAMPLE_DATA_LOADED, "true");
    }
  }, [plans.length, records.length, setPlans, setRecords]);

  const appendLogEntry = useCallback(
    (
      kind: "plan" | "actual",
      date: string,
      previousMinutes: number,
      nextMinutes: number,
      source: string
    ) => {
      if (previousMinutes === nextMinutes) {
        return sessionsRef.current;
      }
      const entry: StudySession = {
        id: generateId("edit"),
        date,
        kind,
        previousMinutes,
        minutes: nextMinutes,
        recordedAt: new Date().toISOString(),
        source,
      };
      let updatedSessions: StudySession[] = [];
      setSessions((prev) => {
        updatedSessions = [entry, ...prev];
        sessionsRef.current = updatedSessions;
        return updatedSessions;
      });
      return updatedSessions;
    },
    [setSessions]
  );

  const handleDateClick = useCallback(
    (date: string) => {
      setSelectedDate(date);
      setDailyViewDate(date);
      // Show both options - user can choose to plan or record
      setShowPlanForm(true);
    },
    [setDailyViewDate]
  );

  const handlePlanSave = useCallback((plan: PlanData) => {
    try {
      // Validate plan data
      const validation = validatePlanData(plan);
      if (!validation.valid) {
        setError(validation.error || "Invalid plan data");
        return;
      }

      // Sanitize plan data
      const sanitized = sanitizePlanData(plan);

      const existingIndex = plansIndexMap.get(sanitized.date);
      const previousMinutes =
        existingIndex !== undefined && existingIndex >= 0
          ? toMinutes(plans[existingIndex].hours, plans[existingIndex].minutes)
          : 0;
      const nextMinutes = toMinutes(sanitized.hours, sanitized.minutes);

      if (existingIndex !== undefined && existingIndex >= 0) {
        const updated = [...plans];
        updated[existingIndex] = sanitized;
        setPlans(updated);
        const sessionsAfter = appendLogEntry(
          "plan",
          sanitized.date,
          previousMinutes,
          nextMinutes,
          "Plan updated"
        );
        createBackupSnapshot(records, updated, sessionsAfter, "Plan updated");
      } else {
        const updated = [...plans, sanitized];
        setPlans(updated);
        const sessionsAfter = appendLogEntry(
          "plan",
          sanitized.date,
          previousMinutes,
          nextMinutes,
          "Plan added"
        );
        createBackupSnapshot(records, updated, sessionsAfter, "Plan added");
      }
      setShowPlanForm(false);
      setSelectedDate(null);
      setError(null);
    } catch (err) {
      setError("Failed to save plan. Please try again.");
      logError("Error saving plan:", err);
    }
  }, [appendLogEntry, plans, plansIndexMap, records, createBackupSnapshot, setPlans]);

  const handlePlanCancel = useCallback(() => {
    setShowPlanForm(false);
    setSelectedDate(null);
    setError(null);
  }, []);

  const handleDeletePlan = useCallback((date: string) => {
    try {
      const index = plansIndexMap.get(date);
      if (index === undefined) {
        return;
      }
      const updated = [...plans];
      const previousMinutes = toMinutes(updated[index].hours, updated[index].minutes);
      updated.splice(index, 1);
      setPlans(updated);
      const sessionsAfter = appendLogEntry("plan", date, previousMinutes, 0, "Plan deleted");
      createBackupSnapshot(records, updated, sessionsAfter, "Plan deleted");
      setError(null);
    } catch (err) {
      setError("Failed to delete plan. Please try again.");
      logError("Error deleting plan:", err);
    }
  }, [appendLogEntry, plans, plansIndexMap, records, createBackupSnapshot, setPlans]);

  const handleRecordClick = useCallback(() => {
    if (!selectedDate) {
      setSelectedDate(formatDate(new Date()));
    }
    setShowPlanForm(false);
    setShowRecordModal(true);
  }, [selectedDate]);

  const handleTodayViewPlan = useCallback((date: string) => {
    setSelectedDate(date);
    setShowPlanForm(true);
  }, []);

  const handleTodayViewRecord = useCallback((date: string) => {
    setSelectedDate(date);
    setShowRecordModal(true);
  }, []);

  const handleEditRecord = useCallback((date: string, minutes: number) => {
    try {
      const record: StudyRecord = { date, minutes };
      const validation = validateStudyRecord(record);
      if (!validation.valid) {
        setError(validation.error || "Invalid record data");
        return;
      }

      const sanitized = sanitizeStudyRecord(record);

      const existingIndex = recordsIndexMap.get(sanitized.date);
      if (existingIndex !== undefined && existingIndex >= 0) {
        const updated = [...records];
        const previousMinutes = updated[existingIndex].minutes;
        updated[existingIndex] = {
          ...updated[existingIndex],
          minutes: sanitized.minutes,
        };
        setRecords(updated);
        const sessionsAfter = appendLogEntry(
          "actual",
          sanitized.date,
          previousMinutes,
          sanitized.minutes,
          "Record edited"
        );
        createBackupSnapshot(updated, plans, sessionsAfter, "Record edited");
      } else {
        const updated = [...records, sanitized];
        setRecords(updated);
        const sessionsAfter = appendLogEntry(
          "actual",
          sanitized.date,
          0,
          sanitized.minutes,
          "Record added"
        );
        createBackupSnapshot(updated, plans, sessionsAfter, "Record added");
      }
      setError(null);
    } catch (err) {
      setError("Failed to edit record. Please try again.");
      logError("Error editing record:", err);
    }
  }, [appendLogEntry, records, recordsIndexMap, plans, createBackupSnapshot, setRecords]);

  const handleDeleteRecord = useCallback((date: string) => {
    try {
      const index = recordsIndexMap.get(date);
      if (index === undefined) {
        return;
      }
      const updated = [...records];
      const previousMinutes = updated[index].minutes;
      updated.splice(index, 1);
      setRecords(updated);
      const sessionsAfter = appendLogEntry("actual", date, previousMinutes, 0, "Record deleted");
      createBackupSnapshot(updated, plans, sessionsAfter, "Record deleted");
      setError(null);
    } catch (err) {
      setError("Failed to delete record. Please try again.");
      logError("Error deleting record:", err);
    }
  }, [appendLogEntry, records, recordsIndexMap, plans, createBackupSnapshot, setRecords]);

  const handleSheetPlanUpsert = useCallback(
    (plan: PlanData) => {
      handlePlanSave(plan);
    },
    [handlePlanSave]
  );

  const handleSheetRecordUpsert = useCallback(
    (date: string, minutes: number) => {
      handleEditRecord(date, minutes);
    },
    [handleEditRecord]
  );

  const handleDuplicatePreviousPlan = useCallback(
    (targetDate: string) => {
      const baseDate = new Date(targetDate + "T00:00:00");
      if (Number.isNaN(baseDate.getTime())) {
        setError("Invalid date for duplication.");
        return;
      }
      const previousDate = new Date(baseDate);
      previousDate.setDate(baseDate.getDate() - 1);
      const formattedPrevious = formatDate(previousDate);
      const previousPlan = plans.find((plan) => plan.date === formattedPrevious);
      if (!previousPlan) {
        setError("No plan found for the previous day to duplicate.");
        return;
      }

      const duplicatedPlan: PlanData = {
        date: targetDate,
        hours: previousPlan.hours,
        minutes: previousPlan.minutes,
      };

      handlePlanSave(duplicatedPlan);
      setSelectedDate(targetDate);
      setDailyViewDate(targetDate);
      setError(null);
    },
    [handlePlanSave, plans, setDailyViewDate]
  );

  const handleClearHistoryForDate = useCallback(
    (date: string) => {
      let updatedLogs: StudySession[] = sessionsRef.current;
      setSessions((prev) => {
        const next = prev.filter((log) => log.date !== date);
        sessionsRef.current = next;
        updatedLogs = next;
        return next;
      });
      createBackupSnapshot(records, plans, updatedLogs, "History cleared");
      setError(null);
    },
    [createBackupSnapshot, plans, records, setSessions]
  );

  const cycleColorTheme = useCallback(() => {
    const index = COLOR_THEME_OPTIONS.findIndex((option) => option.value === colorTheme);
    const next = COLOR_THEME_OPTIONS[(index + 1) % COLOR_THEME_OPTIONS.length];
    setColorTheme(next.value);
  }, [colorTheme, setColorTheme]);

  const activeColorTheme = useMemo(
    () => COLOR_THEME_OPTIONS.find((option) => option.value === colorTheme) ?? COLOR_THEME_OPTIONS[0],
    [colorTheme]
  );

  const handleRecordSave = useCallback((record: StudyRecord) => {
    try {
      // Validate record data
      const validation = validateStudyRecord(record);
      if (!validation.valid) {
        setError(validation.error || "Invalid record data");
        return;
      }

      // Sanitize record data
      const sanitized = sanitizeStudyRecord(record);

      // Add to existing records for the same date (accumulate)
      const existingIndex = recordsIndexMap.get(sanitized.date);
      if (existingIndex !== undefined && existingIndex >= 0) {
        const updated = [...records];
        const previousMinutes = updated[existingIndex].minutes;
        const totalMinutes = previousMinutes + sanitized.minutes;
        // Ensure total doesn't exceed 24 hours
        updated[existingIndex] = {
          ...updated[existingIndex],
          minutes: Math.min(totalMinutes, TIME_LIMITS.MAX_MINUTES_PER_DAY),
        };
        setRecords(updated);
        const sessionsAfter = appendLogEntry(
          "actual",
          sanitized.date,
          previousMinutes,
          Math.min(totalMinutes, TIME_LIMITS.MAX_MINUTES_PER_DAY),
          "Record saved"
        );
        createBackupSnapshot(updated, plans, sessionsAfter, "Record saved");
      } else {
        const updated = [...records, sanitized];
        setRecords(updated);
        const sessionsAfter = appendLogEntry(
          "actual",
          sanitized.date,
          0,
          Math.min(sanitized.minutes, TIME_LIMITS.MAX_MINUTES_PER_DAY),
          "Record saved"
        );
        createBackupSnapshot(updated, plans, sessionsAfter, "Record saved");
      }
      setShowRecordModal(false);
      setSelectedDate(null);
      setError(null);
    } catch (err) {
      setError("Failed to save record. Please try again.");
      logError("Error saving record:", err);
    }
  }, [appendLogEntry, records, recordsIndexMap, plans, createBackupSnapshot, setRecords]);

  const handleRecordCancel = useCallback(() => {
    setShowRecordModal(false);
    setSelectedDate(null);
    setError(null);
  }, []);

  const navigateMonth = useCallback((direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  }, [currentDate]);

  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    setDailyViewDate(formatDate(today));
  }, [setDailyViewDate]);

  const handleDailyViewSelectDate = useCallback(
    (date: string) => {
      if (!date) return;
      setDailyViewDate(date);
    },
    [setDailyViewDate]
  );

  const handleDailyViewNavigate = useCallback(
    (direction: "prev" | "next") => {
      setDailyViewDate((prev) => {
        const base = new Date(prev + "T00:00:00");
        if (Number.isNaN(base.getTime())) {
          return formatDate(new Date());
        }
        if (direction === "prev") {
          base.setDate(base.getDate() - 1);
        } else {
          base.setDate(base.getDate() + 1);
        }
        return formatDate(base);
      });
    },
    [setDailyViewDate]
  );

  const handleBulkPlanSave = useCallback((bulkPlans: PlanData[]) => {
    try {
      const updatedPlans = [...plans];
      const indexMap = new Map(plansIndexMap);
      let sessionsAfter = sessionsRef.current;

      bulkPlans.forEach((bulkPlan) => {
        const sanitizedPlan = sanitizePlanData(bulkPlan);
        const existingIndex = indexMap.get(sanitizedPlan.date);
        if (existingIndex !== undefined && existingIndex >= 0) {
          const previousMinutes = toMinutes(
            updatedPlans[existingIndex].hours,
            updatedPlans[existingIndex].minutes
          );
          const nextMinutes = toMinutes(sanitizedPlan.hours, sanitizedPlan.minutes);
          updatedPlans[existingIndex] = sanitizedPlan;
          sessionsAfter = appendLogEntry(
            "plan",
            sanitizedPlan.date,
            previousMinutes,
            nextMinutes,
            "Bulk plan update"
          );
        } else {
          const nextMinutes = toMinutes(sanitizedPlan.hours, sanitizedPlan.minutes);
          const newIndex = updatedPlans.push(sanitizedPlan) - 1;
          indexMap.set(sanitizedPlan.date, newIndex);
          sessionsAfter = appendLogEntry(
            "plan",
            sanitizedPlan.date,
            0,
            nextMinutes,
            "Bulk plan add"
          );
        }
      });

      setPlans(updatedPlans);
      createBackupSnapshot(records, updatedPlans, sessionsAfter, "Bulk plan update");
      setError(null);
    } catch (err) {
      setError("Failed to save bulk plans. Please try again.");
      logError("Error saving bulk plans:", err);
    }
  }, [appendLogEntry, plans, plansIndexMap, records, createBackupSnapshot, setPlans]);

  const handleDataImport = useCallback((importedRecords: StudyRecord[], importedPlans: PlanData[]) => {
    try {
      const sanitizedRecords = importedRecords.map((record) => sanitizeStudyRecord(record));
      const sanitizedPlans = importedPlans.map((plan) => sanitizePlanData(plan));

      setRecords(sanitizedRecords);
      setPlans(sanitizedPlans);
      setSessions([]);
      createBackupSnapshot(sanitizedRecords, sanitizedPlans, [], "Data import");
      setError(null);
    } catch (err) {
      setError("Failed to import data. Please try again.");
      logError("Error importing data:", err);
    }
  }, [createBackupSnapshot, setRecords, setSessions, setPlans]);

  const handleClearAllData = useCallback(() => {
    setShowClearConfirm(true);
  }, []);

  const handleClearAllDataConfirm = useCallback(() => {
    setPlans([]);
    setRecords([]);
    setSessions([]);
    deleteAllBackups();
    setShowPlanForm(false);
    setShowRecordModal(false);
    setSelectedDate(null);
    setError(null);
    setShowClearConfirm(false);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEYS.SAMPLE_DATA_LOADED, "true");
    }
  }, [deleteAllBackups, setPlans, setRecords, setSessions]);

  const handleLoadSampleData = useCallback(() => {
    const { plans: samplePlans, records: sampleRecords } = generateSampleData(new Date());
    setPlans(samplePlans);
    setRecords(sampleRecords);
    setSessions([]);
    createBackupSnapshot(sampleRecords, samplePlans, [], "Sample data loaded");
    setShowPlanForm(false);
    setShowRecordModal(false);
    setSelectedDate(null);
    setError(null);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEYS.SAMPLE_DATA_LOADED, "true");
    }
  }, [createBackupSnapshot, setPlans, setRecords, setSessions]);

  const handleBulkRecordSave = useCallback((bulkRecords: StudyRecord[], bulkPlans: PlanData[]) => {
    try {
      // Merge with existing data
      const updatedRecords = [...records];
      const updatedPlans = [...plans];
      let sessionsAfter = sessionsRef.current;

      // Add or update records
      bulkRecords.forEach((record) => {
        const sanitizedRecord = sanitizeStudyRecord(record);
        const existingIndex = recordsIndexMap.get(sanitizedRecord.date);
        if (existingIndex !== undefined) {
          const previousMinutes = updatedRecords[existingIndex].minutes;
          const totalMinutes = Math.min(previousMinutes + sanitizedRecord.minutes, TIME_LIMITS.MAX_MINUTES_PER_DAY);
          updatedRecords[existingIndex] = sanitizeStudyRecord({
            ...updatedRecords[existingIndex],
            minutes: totalMinutes,
          });
          sessionsAfter = appendLogEntry(
            "actual",
            sanitizedRecord.date,
            previousMinutes,
            totalMinutes,
            "Bulk record update"
          );
        } else {
          updatedRecords.push(sanitizedRecord);
          sessionsAfter = appendLogEntry(
            "actual",
            sanitizedRecord.date,
            0,
            sanitizedRecord.minutes,
            "Bulk record add"
          );
        }
      });

      // Add or update plans
      bulkPlans.forEach((plan) => {
        const sanitizedPlan = sanitizePlanData(plan);
        const existingIndex = plansIndexMap.get(sanitizedPlan.date);
        if (existingIndex !== undefined) {
          const previousMinutes = toMinutes(
            updatedPlans[existingIndex].hours,
            updatedPlans[existingIndex].minutes
          );
          updatedPlans[existingIndex] = sanitizePlanData({
            ...updatedPlans[existingIndex],
            hours: sanitizedPlan.hours,
            minutes: sanitizedPlan.minutes,
          });
          const nextMinutes = toMinutes(sanitizedPlan.hours, sanitizedPlan.minutes);
          sessionsAfter = appendLogEntry(
            "plan",
            sanitizedPlan.date,
            previousMinutes,
            nextMinutes,
            "Bulk plan update"
          );
        } else {
          updatedPlans.push(sanitizedPlan);
          const nextMinutes = toMinutes(sanitizedPlan.hours, sanitizedPlan.minutes);
          sessionsAfter = appendLogEntry(
            "plan",
            sanitizedPlan.date,
            0,
            nextMinutes,
            "Bulk plan add"
          );
        }
      });

      setRecords(updatedRecords);
      setPlans(updatedPlans);
      setShowBulkRecordAdd(false);
      createBackupSnapshot(updatedRecords, updatedPlans, sessionsAfter, "Bulk record update");
      setError(null);
    } catch (err) {
      setError("Failed to save bulk records. Please try again.");
      logError("Error saving bulk records:", err);
    }
  }, [
    appendLogEntry,
    records,
    recordsIndexMap,
    plans,
    plansIndexMap,
    setPlans,
    setRecords,
    createBackupSnapshot,
  ]);


  return (
    <LocaleProvider value={{ locale, setLocale }}>
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center space-y-2 relative">
          <div className="absolute top-0 right-0 flex gap-2">
            <button
              onClick={cycleColorTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 
                         hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 
                         transition-colors duration-200 flex items-center justify-center"
              aria-label="Toggle calendar color theme"
              title={`Switch calendar theme (current: ${activeColorTheme.title})`}
            >
              <Image
                src={activeColorTheme.icon}
                alt={`${activeColorTheme.title} theme icon`}
                width={20}
                height={20}
                className="w-5 h-5"
              />
            </button>
            <DarkModeToggle />
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 
                         hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 
                         transition-colors duration-200"
              aria-label="Toggle settings"
              title="Settings"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
          <h1 className="text-4xl font-normal text-gray-800 dark:text-gray-200">Study Hour Calendar</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your learning progress visually</p>
        </header>

        {/* View Mode Toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-1 shadow-sm">
            <button
              onClick={() => {
                setViewMode("today");
                setDailyViewDate(formatDate(new Date()));
              }}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                viewMode === "today"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
              aria-label="Today view"
            >
              Today
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                viewMode === "calendar"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
              aria-label="Calendar view"
            >
              Calendar
            </button>
            <button
              onClick={() => setViewMode("sheet")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                viewMode === "sheet"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
              aria-label="Sheet view"
            >
              Sheet
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">Language</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Choose the language used for dates, numbers, and interface labels.
              </p>
              <label
                htmlFor="locale-select"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Display language
              </label>
              <select
                id="locale-select"
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en-US">English (United States)</option>
                <option value="ja-JP">日本語</option>
              </select>
            </div>
            <DataExportImport
              records={records}
              plans={plans}
              onImport={handleDataImport}
            />
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">Calendar Colors</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Choose how achievement cells are colored on the calendar and today view.
              </p>
              <div className="space-y-4">
                <div className="inline-flex rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-1 shadow-sm">
                  {COLOR_THEME_OPTIONS.map((option) => {
                    const isActive = colorTheme === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setColorTheme(option.value)}
                        className={`flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-2xl transition-colors duration-200 ${
                          isActive
                            ? "bg-blue-600 text-white shadow"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                        aria-pressed={isActive}
                      >
                        <Image
                          src={option.icon}
                          alt={`${option.title} theme icon`}
                          width={20}
                          height={20}
                          className="w-5 h-5 flex-shrink-0"
                        />
                        {option.title}
                      </button>
                    );
                  })}
                </div>
                {COLOR_THEME_OPTIONS.map((option) =>
                  option.value === colorTheme ? (
                    <p
                      key={option.value}
                      className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed"
                    >
                      {option.description}
                    </p>
                  ) : null
                )}
              </div>
            </div>
            <NotificationSettings />
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm lg:col-span-2 space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Data Management</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Clear everything stored on this device or reload the sample dataset for demos.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleClearAllData}
                  className="px-5 py-2.5 rounded-lg bg-red-600 text-white font-medium shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
                >
                  Clear All Data
                </button>
                <button
                  onClick={handleLoadSampleData}
                  className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  Load Sample Data
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Clearing data removes plans, records, and backups stored locally. This action cannot be undone.
              </p>
            </div>
            <div className="lg:col-span-2">
              <BackupManager
                backups={backups}
                onBackupNow={backupNow}
                onRestore={restoreBackup}
                onDelete={deleteBackupById}
                onDeleteAll={deleteAllBackups}
                restoreContext={
                  restoreContext
                    ? {
                        backupId: restoreContext.backupId,
                        appliedAt: restoreContext.appliedAt,
                        expiresAt: restoreContext.expiresAt,
                      }
                    : null
                }
                onUndoRestore={undoRestore}
                onDismissUndo={dismissRestoreBanner}
              />
            </div>
          </div>
        )}

        {/* Bulk Record Add Button */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowBulkRecordAdd(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg 
                       hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 
                       transition-colors duration-200 font-medium shadow-sm flex items-center gap-2"
            aria-label="Bulk add past records"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Bulk Add Past Records
          </button>
        </div>

        {/* Today View */}
        {viewMode === "today" && (
          <TodayView
            records={records}
            plans={plans}
            editLogs={sessions}
            onDuplicatePlan={handleDuplicatePreviousPlan}
            onClearHistory={handleClearHistoryForDate}
            selectedDate={dailyViewDate}
            onSelectDate={handleDailyViewSelectDate}
            onNavigateDay={handleDailyViewNavigate}
            onEditPlan={handleTodayViewPlan}
            onDeletePlan={handleDeletePlan}
            onAddRecord={handleTodayViewRecord}
            onEditRecord={handleEditRecord}
            onDeleteRecord={handleDeleteRecord}
            colorTheme={colorTheme}
          />
        )}

        {/* Sheet View */}
        {viewMode === "sheet" && (
          <SheetView
            plans={plans}
            records={records}
            onUpsertPlan={handleSheetPlanUpsert}
            onDeletePlan={handleDeletePlan}
            onUpsertRecord={handleSheetRecordUpsert}
            onDeleteRecord={handleDeleteRecord}
          />
        )}

        {/* Calendar View */}
        {viewMode === "calendar" && (
          <>
            {/* Navigation Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateMonth("prev")}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg 
                             hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
                             transition-colors duration-200"
                  aria-label="Previous month"
                >
                  ← Prev
                </button>
                <button
                  onClick={goToToday}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg 
                             hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
                             transition-colors duration-200"
                  aria-label="Go to today"
                >
                  Today
                </button>
                <button
                  onClick={() => navigateMonth("next")}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg 
                             hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
                             transition-colors duration-200"
                  aria-label="Next month"
                >
                  Next →
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBulkModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg 
                             hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 
                             transition-colors duration-200 font-medium shadow-sm"
                  aria-label="Bulk set plans"
                >
                  Bulk Set Plans
                </button>
                <button
                  onClick={handleRecordClick}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg 
                             hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
                             transition-colors duration-200 font-medium shadow-sm"
                  aria-label="Record study time"
                >
                  + Record Study Time
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <CalendarGrid
              records={records}
              plans={plans}
              currentDate={currentDate}
              onDateClick={handleDateClick}
              colorTheme={colorTheme}
            />

            {/* Achievement Statistics */}
            <AchievementStats records={records} plans={plans} currentDate={currentDate} />

            {/* Achievement Chart */}
            <AchievementChart records={records} plans={plans} currentDate={currentDate} />
          </>
        )}

        {/* Plan Input Form Modal */}
        {showPlanForm && selectedDate && (
          <div
            className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4"
            onClick={handlePlanCancel}
            role="dialog"
            aria-modal="true"
          >
            <div onClick={(e) => e.stopPropagation()}>
              <PlanInputForm
                selectedDate={selectedDate}
                existingPlan={plans.find((p) => p.date === selectedDate)}
                onSave={handlePlanSave}
                onCancel={handlePlanCancel}
              />
            </div>
          </div>
        )}

        {/* Record Modal */}
        {showRecordModal && selectedDate && (
          <RecordModal
            selectedDate={selectedDate}
            onSave={handleRecordSave}
            onCancel={handleRecordCancel}
          />
        )}

        {/* Bulk Operation Modal */}
        <BulkOperationModal
          isOpen={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          onSave={handleBulkPlanSave}
        />

        {/* Bulk Record Add Modal */}
        {showBulkRecordAdd && (
          <BulkRecordAdd
            onSave={handleBulkRecordSave}
            onCancel={() => setShowBulkRecordAdd(false)}
          />
        )}

        {/* Clear All Data Confirmation Dialog */}
        {showClearConfirm && (
          <ConfirmDialog
            title="Clear All Data"
            message="Are you sure you want to clear all study data and backups? This action cannot be undone."
            confirmText="Clear All"
            cancelText="Cancel"
            onConfirm={handleClearAllDataConfirm}
            onCancel={() => setShowClearConfirm(false)}
          />
        )}
      </div>
      </main>
    </LocaleProvider>
  );
}

