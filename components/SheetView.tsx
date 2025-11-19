"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import type { PlanData, StudyRecord } from "@/types";
import { useLocale } from "@/context/LocaleContext";
import { parseDate, formatDate } from "@/lib/utils";
import { getDailyAchievement } from "@/lib/calculations";

interface SheetRow {
  date: string;
  formattedDate: string;
  planHours: number;
  planMinutes: number;
  recordMinutes: number;
  achievementRate: number;
  planExists: boolean;
  recordExists: boolean;
}

interface SheetViewProps {
  plans: PlanData[];
  records: StudyRecord[];
  onUpsertPlan: (plan: PlanData) => void;
  onDeletePlan: (date: string) => void;
  onUpsertRecord: (date: string, minutes: number) => void;
  onDeleteRecord: (date: string) => void;
}

type RowForm = {
  planHours: string;
  planMinutes: string;
  recordHours: string;
  recordMinutes: string;
  planExists: boolean;
  recordExists: boolean;
};

const clampMinutes = (value: number, max: number) => {
  if (Number.isNaN(value) || value < 0) return 0;
  return Math.min(value, max);
};

const clampHourMinutePair = (hours: number, minutes: number) => {
  const safeHours = clampMinutes(hours, 24);
  const safeMinutes = clampMinutes(minutes, 59);
  return {
    hours: safeHours,
    minutes: safeMinutes,
  };
};

const minutesToHM = (value: number) => {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return { hours, minutes };
};

export default function SheetView({
  plans,
  records,
  onUpsertPlan,
  onDeletePlan,
  onUpsertRecord,
  onDeleteRecord,
}: SheetViewProps) {
  const { locale } = useLocale();
  const [customDates, setCustomDates] = useState<string[]>([]);
  const [newDate, setNewDate] = useState<string>(formatDate(new Date()));
  const [rowValues, setRowValues] = useState<Record<string, RowForm>>({});
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  const planMap = useMemo(() => new Map(plans.map((plan) => [plan.date, plan])), [plans]);
  const recordMap = useMemo(() => new Map(records.map((record) => [record.date, record])), [records]);

  const allDates = useMemo(() => {
    const set = new Set<string>();
    plans.forEach((plan) => set.add(plan.date));
    records.forEach((record) => set.add(record.date));
    customDates.forEach((date) => set.add(date));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [plans, records, customDates]);

  const rows: SheetRow[] = useMemo(
    () =>
      allDates.map((date) => {
        const plan = planMap.get(date);
        const record = recordMap.get(date);
        const achievement = getDailyAchievement(records, plans, date);
        const parsed = parseDate(date);
        const formattedDate = Number.isNaN(parsed.getTime())
          ? date
          : parsed.toLocaleDateString(locale, {
              year: "numeric",
              month: "short",
              day: "numeric",
            });

        return {
          date,
          formattedDate,
          planHours: plan?.hours ?? 0,
          planMinutes: plan?.minutes ?? 0,
          recordMinutes: record?.minutes ?? 0,
          achievementRate: achievement.achievementRate,
          planExists: Boolean(plan),
          recordExists: Boolean(record),
        };
      }),
    [allDates, planMap, recordMap, records, plans, locale]
  );

  useEffect(() => {
    setRowValues((prev) => {
      const next: Record<string, RowForm> = {};
      rows.forEach((row) => {
        const prevRow = prev[row.date];
        next[row.date] = {
          planHours: prevRow?.planHours ?? (row.planExists ? row.planHours.toString() : ""),
          planMinutes: prevRow?.planMinutes ?? (row.planExists ? row.planMinutes.toString() : ""),
          recordHours:
            prevRow?.recordHours ??
            (row.recordExists ? minutesToHM(row.recordMinutes).hours.toString() : ""),
          recordMinutes:
            prevRow?.recordMinutes ??
            (row.recordExists ? minutesToHM(row.recordMinutes).minutes.toString() : ""),
          planExists: row.planExists,
          recordExists: row.recordExists,
        };
      });
      return next;
    });
  }, [rows]);

  // Remove custom rows once data exists
  useEffect(() => {
    setCustomDates((prev) => prev.filter((date) => !planMap.has(date) && !recordMap.has(date)));
  }, [planMap, recordMap]);

  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    rows.forEach((row) => monthsSet.add(row.date.slice(0, 7)));
    return Array.from(monthsSet)
      .sort((a, b) => b.localeCompare(a))
      .map((value) => {
        const [year, month] = value.split("-");
        const date = new Date(Number(year), Number(month) - 1, 1);
        const label = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long" }).format(date);
        return { value, label };
      });
  }, [locale, rows]);

  const [selectedMonth, setSelectedMonth] = useState<string>(() => availableMonths[0]?.value ?? "");

  useEffect(() => {
    if (availableMonths.length === 0) {
      setSelectedMonth("");
      return;
    }
    if (!availableMonths.some((month) => month.value === selectedMonth)) {
      setSelectedMonth(availableMonths[0].value);
    }
  }, [availableMonths, selectedMonth]);

  const visibleRows = useMemo(() => {
    if (!selectedMonth) {
      return rows;
    }
    return rows.filter((row) => row.date.startsWith(selectedMonth));
  }, [rows, selectedMonth]);

  const handleRowValueChange = (date: string, field: keyof RowForm, value: string) => {
    setRowValues((prev) => ({
      ...prev,
      [date]: {
        ...(prev[date] ?? {
          planHours: "",
          planMinutes: "",
          recordMinutes: "",
          planExists: false,
          recordExists: false,
        }),
        [field]: value,
      },
    }));
  };

  const commitPlan = (date: string) => {
    const row = rowValues[date];
    if (!row) {
      return;
    }

    const hours = clampMinutes(parseInt(row.planHours, 10), 24);
    const minutes = clampMinutes(parseInt(row.planMinutes, 10), 59);

    if ((hours === 0 && minutes === 0) || (Number.isNaN(hours) && Number.isNaN(minutes))) {
      if (row.planExists) {
        onDeletePlan(date);
      }
      return;
    }

    const { hours: safeHours, minutes: safeMinutes } = clampHourMinutePair(hours, minutes);
    onUpsertPlan({
      date,
      hours: safeHours,
      minutes: safeMinutes,
    });
    setRowValues((prev) => ({
      ...prev,
      [date]: {
        ...prev[date],
        planHours: safeHours.toString(),
        planMinutes: safeMinutes.toString(),
        planExists: true,
      },
    }));
  };

  const commitRecord = (date: string) => {
    const row = rowValues[date];
    if (!row) {
      return;
    }

    const hours = clampMinutes(parseInt(row.recordHours, 10), 24);
    const minutes = clampMinutes(parseInt(row.recordMinutes, 10), 59);
    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes === 0) {
      if (row.recordExists) {
        onDeleteRecord(date);
      }
      return;
    }

    onUpsertRecord(date, totalMinutes);
    setRowValues((prev) => ({
      ...prev,
      [date]: {
        ...prev[date],
        recordHours: hours.toString(),
        recordMinutes: minutes.toString(),
        recordExists: true,
      },
    }));
  };

  const handleAddDate = () => {
    if (!newDate) {
      return;
    }
    if (rowValues[newDate]) {
      setNewDate("");
      return;
    }
    setCustomDates((prev) => [...prev, newDate]);
    setRowValues((prev) => ({
      ...prev,
      [newDate]: {
        planHours: "",
        planMinutes: "",
        recordHours: "",
        recordMinutes: "",
        planExists: false,
        recordExists: false,
      },
    }));
    setNewDate("");
    const monthValue = newDate.slice(0, 7);
    setSelectedMonth(monthValue);
  };

  const handleRemoveCustomDate = (date: string) => {
    setCustomDates((prev) => prev.filter((d) => d !== date));
    setRowValues((prev) => {
      const next = { ...prev };
      delete next[date];
      return next;
    });
  };

  const copyRows = async (data: SheetRow[]) => {
    const header = ["date", "plan_hours", "plan_minutes", "actual_hours", "actual_minutes", "achievement_rate"];
    const lines = data.map((row) => {
      const values = rowValues[row.date] ?? {
        planHours: "",
        planMinutes: "",
        recordHours: "",
        recordMinutes: "",
      };
      return [
        row.date,
        values.planHours ?? "",
        values.planMinutes ?? "",
        values.recordHours ?? "",
        values.recordMinutes ?? "",
        row.achievementRate ?? "",
      ]
        .map((value) => `${value}`)
        .join("\t");
    });

    const payload = [header.join("\t"), ...lines].join("\n");
    try {
      await navigator.clipboard.writeText(payload);
      setCopyStatus("Copied spreadsheet data to clipboard.");
      window.setTimeout(() => setCopyStatus(null), 2000);
    } catch (error) {
      console.error("Failed to copy spreadsheet data", error);
      setCopyStatus("Clipboard not available. Please select and copy manually.");
    }
  };

  const handleSelectAll = () => {
    const table = tableRef.current;
    if (!table) return;
    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    const range = document.createRange();
    range.selectNodeContents(table);
    selection.addRange(range);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-medium text-gray-800 dark:text-gray-200">Sheet View</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Edit plans and records inline. Copy the table into spreadsheets, documents, or emails.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Month</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const index = availableMonths.findIndex((m) => m.value === selectedMonth);
                  if (index >= 0 && index < availableMonths.length - 1) {
                    setSelectedMonth(availableMonths[index + 1].value);
                  }
                }}
                className="p-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={
                  availableMonths.length === 0 ||
                  availableMonths.findIndex((m) => m.value === selectedMonth) === availableMonths.length - 1
                }
                aria-label="Previous month"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <select
                id="sheet-month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableMonths.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  const index = availableMonths.findIndex((m) => m.value === selectedMonth);
                  if (index > 0) {
                    setSelectedMonth(availableMonths[index - 1].value);
                  }
                }}
                className="p-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={
                  availableMonths.length === 0 ||
                  availableMonths.findIndex((m) => m.value === selectedMonth) === 0
                }
                aria-label="Next month"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
            <label htmlFor="sheet-new-date" className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Add date
            </label>
            <input
              id="sheet-new-date"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleAddDate}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add
            </button>
          </div>
          <button
            type="button"
            onClick={handleSelectAll}
            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Select Table
          </button>
          <button
            type="button"
            onClick={() => copyRows(visibleRows)}
            className="px-3 py-1.5 text-sm rounded-md bg-emerald-600 hover:bg-emerald-500 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            Copy Month TSV
          </button>
          <button
            type="button"
            onClick={() => copyRows(rows)}
            className="px-3 py-1.5 text-sm rounded-md bg-emerald-500 hover:bg-emerald-400 text-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            Copy All TSV
          </button>
        </div>
      </div>
      {copyStatus && (
        <div className="px-4 py-2 rounded-md bg-blue-50 dark:bg-blue-900/40 text-sm text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
          {copyStatus}
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900">
        <table ref={tableRef} className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800/60">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Plan (h)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Plan (m)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actual (h)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actual (m)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Achievement %
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-sm">
            {visibleRows.map((row) => {
              const form = rowValues[row.date] ?? {
                planHours: "",
                planMinutes: "",
                recordHours: "",
                recordMinutes: "",
                planExists: false,
                recordExists: false,
              };
              const planTotalMinutes = row.planHours * 60 + row.planMinutes;
              const { hours: planHoursDisplay, minutes: planMinutesDisplay } = minutesToHM(planTotalMinutes);
              const actualHM = minutesToHM(row.recordMinutes);
              return (
                <tr key={row.date} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{row.formattedDate}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{row.date}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <input
                      type="number"
                      min={0}
                      max={24}
                      value={form.planHours}
                      onChange={(e) => handleRowValueChange(row.date, "planHours", e.target.value)}
                      onBlur={() => commitPlan(row.date)}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={planHoursDisplay ? planHoursDisplay.toString() : "0"}
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={form.planMinutes}
                      onChange={(e) => handleRowValueChange(row.date, "planMinutes", e.target.value)}
                      onBlur={() => commitPlan(row.date)}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={planMinutesDisplay ? planMinutesDisplay.toString() : "0"}
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <input
                      type="number"
                      min={0}
                      max={24}
                      value={form.recordHours}
                      onChange={(e) => handleRowValueChange(row.date, "recordHours", e.target.value)}
                      onBlur={() => commitRecord(row.date)}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder={row.recordMinutes ? actualHM.hours.toString() : "0"}
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={form.recordMinutes}
                      onChange={(e) => handleRowValueChange(row.date, "recordMinutes", e.target.value)}
                      onBlur={() => commitRecord(row.date)}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder={row.recordMinutes ? actualHM.minutes.toString() : "0"}
                    />
                  </td>
                  <td className="px-4 py-3 align-top text-gray-700 dark:text-gray-200">
                    {Number.isNaN(row.achievementRate) ? "—" : `${row.achievementRate}%`}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-wrap gap-2">
                      {form.planExists && (
                        <button
                          type="button"
                          onClick={() => onDeletePlan(row.date)}
                          className="px-3 py-1 text-xs rounded-md border border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          Clear Plan
                        </button>
                      )}
                      {form.recordExists && (
                        <button
                          type="button"
                          onClick={() => onDeleteRecord(row.date)}
                          className="px-3 py-1 text-xs rounded-md border border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          Clear Actual
                        </button>
                      )}
                      {!form.planExists && !form.recordExists && customDates.includes(row.date) && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomDate(row.date)}
                          className="px-3 py-1 text-xs rounded-md border border-gray-400 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
                        >
                          Remove Row
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Tip: Enter values and press Tab to move across cells. Leaving a field blank or zero removes the plan or record.
      </p>
    </div>
  );
}


