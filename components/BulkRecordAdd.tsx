"use client";

import { useState, useEffect } from "react";
import type { StudyRecord, PlanData } from "@/types";
import {
  convertDateToISO,
  convertTimeToHoursMinutes,
  formatDateInput,
  formatTimeInput,
} from "@/lib/dateTimeFormat";
import ErrorMessage from "./ErrorMessage";

interface BulkRecordRow {
  id: string;
  date: string; // MM/DD/YYYY format
  planTime: string; // HH:MM format
  actualTime: string; // HH:MM format
}

interface BulkRecordAddProps {
  onSave: (records: StudyRecord[], plans: PlanData[]) => void;
  onCancel: () => void;
}

/**
 * BulkRecordAdd component - allows bulk addition of past records
 */
export default function BulkRecordAdd({ onSave, onCancel }: BulkRecordAddProps) {
  const [rows, setRows] = useState<BulkRecordRow[]>(() => {
    // Initialize with 5 empty rows
    return Array.from({ length: 5 }, (_, i) => ({
      id: `row-${i}`,
      date: "",
      planTime: "",
      actualTime: "",
    }));
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onCancel]);

  const addRow = () => {
    const newRow: BulkRecordRow = {
      id: `row-${Date.now()}`,
      date: "",
      planTime: "",
      actualTime: "",
    };
    setRows([...rows, newRow]);
  };

  const removeRow = (id: string) => {
    setRows(rows.filter((row) => row.id !== id));
    // Remove errors for this row
    const newErrors = { ...errors };
    Object.keys(newErrors).forEach((key) => {
      if (key.startsWith(id)) {
        delete newErrors[key];
      }
    });
    setErrors(newErrors);
  };

  const updateRow = (id: string, field: keyof BulkRecordRow, value: string) => {
    setRows(
      rows.map((row) => {
        if (row.id === id) {
          // Auto-format input
          if (field === "date") {
            value = formatDateInput(value);
          } else if (field === "planTime" || field === "actualTime") {
            value = formatTimeInput(value);
          }
          return { ...row, [field]: value };
        }
        return row;
      })
    );
    
    // Clear error for this field
    const errorKey = `${id}-${field}`;
    if (errors[errorKey]) {
      const newErrors = { ...errors };
      delete newErrors[errorKey];
      setErrors(newErrors);
    }
  };

  const validateRow = (row: BulkRecordRow): Record<string, string> => {
    const rowErrors: Record<string, string> = {};

    const hasDate = row.date.trim().length > 0;
    const hasPlan = row.planTime.trim().length > 0;
    const hasActual = row.actualTime.trim().length > 0;
    const hasAnyInput = hasDate || hasPlan || hasActual;

    // Allow empty rows with no input whatsoever
    if (!hasAnyInput) {
      return rowErrors;
    }

    // Date validation
    if (!hasDate) {
      rowErrors[`${row.id}-date`] = "Date is required";
    } else {
      const dateResult = convertDateToISO(row.date);
      if (!dateResult.success) {
        rowErrors[`${row.id}-date`] = dateResult.error || "Invalid date";
      }
    }

    // Plan time validation (optional but must be valid if provided)
    if (hasPlan) {
      const planResult = convertTimeToHoursMinutes(row.planTime);
      if (!planResult.success) {
        rowErrors[`${row.id}-planTime`] = planResult.error || "Invalid time";
      }
    }

    // Actual time validation (optional but must be valid if provided)
    if (hasActual) {
      const actualResult = convertTimeToHoursMinutes(row.actualTime);
      if (!actualResult.success) {
        rowErrors[`${row.id}-actualTime`] = actualResult.error || "Invalid time";
      }
    }

    // At least one of plan or actual must be provided
    if (!hasPlan && !hasActual) {
      rowErrors[`${row.id}-general`] = "Please provide at least plan or actual time";
    }

    return rowErrors;
  };

  const handleSave = () => {
    setGlobalError(null);
    const allErrors: Record<string, string> = {};

    // Validate all rows
    rows.forEach((row) => {
      const rowErrors = validateRow(row);
      Object.assign(allErrors, rowErrors);
    });

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      setGlobalError("Please fix the errors before saving");
      return;
    }

    // Convert to PlanData and StudyRecord arrays
    const plans: PlanData[] = [];
    const records: StudyRecord[] = [];

    rows.forEach((row) => {
      const dateResult = convertDateToISO(row.date);
      if (!dateResult.success || !dateResult.date) return;

      const isoDate = dateResult.date;

      // Add plan if provided
      if (row.planTime.trim()) {
        const planResult = convertTimeToHoursMinutes(row.planTime);
        if (planResult.success && planResult.hours !== undefined && planResult.minutes !== undefined) {
          plans.push({
            date: isoDate,
            hours: planResult.hours,
            minutes: planResult.minutes,
          });
        }
      }

      // Add record if provided
      if (row.actualTime.trim()) {
        const actualResult = convertTimeToHoursMinutes(row.actualTime);
        if (actualResult.success && actualResult.hours !== undefined && actualResult.minutes !== undefined) {
          const totalMinutes = actualResult.hours * 60 + actualResult.minutes;
          records.push({
            date: isoDate,
            minutes: totalMinutes,
          });
        }
      }
    });

    if (plans.length === 0 && records.length === 0) {
      setGlobalError("Please add at least one record or plan");
      return;
    }

    onSave(records, plans);
  };

  const validRowsCount = rows.filter((row) => {
    const rowErrors = validateRow(row);
    const hasPlan = row.planTime.trim().length > 0;
    const hasActual = row.actualTime.trim().length > 0;
    const hasAnyInput = row.date.trim().length > 0 || hasPlan || hasActual;
    return hasAnyInput && Object.keys(rowErrors).length === 0 && (hasPlan || hasActual);
  }).length;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-record-add-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto my-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 id="bulk-record-add-title" className="text-lg font-medium text-gray-800 dark:text-gray-200">
            Bulk Add Past Records
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {globalError && (
          <div className="mb-4">
            <ErrorMessage message={globalError} onDismiss={() => setGlobalError(null)} />
          </div>
        )}

        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Format: Date (MM/DD/YYYY) | Plan Time (HH:MM) | Actual Time (HH:MM)
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Valid rows: {validRowsCount} / {rows.length}
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mb-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Date (MM/DD/YYYY)
                </th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Plan Time (HH:MM)
                </th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Actual Time (HH:MM)
                </th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={`border-b border-gray-100 dark:border-gray-700 ${
                    errors[`${row.id}-general`] ? "bg-red-50 dark:bg-red-900/20" : ""
                  }`}
                >
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      placeholder="MM/DD/YYYY"
                      value={row.date}
                      onChange={(e) => updateRow(row.id, "date", e.target.value)}
                      maxLength={10}
                      className={`w-full px-3 py-2 border rounded-lg 
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                 transition-shadow duration-200
                                 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600
                                 ${
                                   errors[`${row.id}-date`]
                                     ? "border-red-500 dark:border-red-500"
                                     : "border-gray-300 dark:border-gray-600"
                                 }`}
                      aria-label={`Date for row ${index + 1}`}
                    />
                    {errors[`${row.id}-date`] && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {errors[`${row.id}-date`]}
                      </p>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      placeholder="HH:MM"
                      value={row.planTime}
                      onChange={(e) => updateRow(row.id, "planTime", e.target.value)}
                      maxLength={5}
                      className={`w-full px-3 py-2 border rounded-lg 
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                 transition-shadow duration-200
                                 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600
                                 ${
                                   errors[`${row.id}-planTime`]
                                     ? "border-red-500 dark:border-red-500"
                                     : "border-gray-300 dark:border-gray-600"
                                 }`}
                      aria-label={`Plan time for row ${index + 1}`}
                    />
                    {errors[`${row.id}-planTime`] && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {errors[`${row.id}-planTime`]}
                      </p>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      placeholder="HH:MM"
                      value={row.actualTime}
                      onChange={(e) => updateRow(row.id, "actualTime", e.target.value)}
                      maxLength={5}
                      className={`w-full px-3 py-2 border rounded-lg 
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                 transition-shadow duration-200
                                 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600
                                 ${
                                   errors[`${row.id}-actualTime`]
                                     ? "border-red-500 dark:border-red-500"
                                     : "border-gray-300 dark:border-gray-600"
                                 }`}
                      aria-label={`Actual time for row ${index + 1}`}
                    />
                    {errors[`${row.id}-actualTime`] && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {errors[`${row.id}-actualTime`]}
                      </p>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {rows.length > 1 && (
                      <button
                        onClick={() => removeRow(row.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 
                                   focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1"
                        aria-label={`Remove row ${index + 1}`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {errors[Object.keys(errors).find((k) => k.endsWith("-general")) || ""] && (
          <div className="mb-4">
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors[Object.keys(errors).find((k) => k.endsWith("-general")) || ""]}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={addRow}
            className="px-4 py-2 bg-green-600 text-white rounded-lg 
                       hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 
                       transition-colors duration-200 font-medium flex items-center gap-2"
            aria-label="Add new row"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Row
          </button>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg 
                         hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 
                         transition-colors duration-200 font-medium"
              aria-label="Cancel"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg 
                         hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
                         transition-colors duration-200 font-medium"
              aria-label="Save all records"
            >
              Save All ({validRowsCount} rows)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

