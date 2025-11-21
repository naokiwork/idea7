"use client";

import { useState, useEffect, useMemo } from "react";
import type { PlanData } from "@/types";
import { formatDate } from "@/lib/utils";
import { useLocale } from "@/context/LocaleContext";
import { sanitizePlanData, validatePlanData } from "@/lib/validation";
import ErrorMessage from "./ErrorMessage";
import { TIME_LIMITS } from "@/lib/constants";

interface PlanInputFormProps {
  selectedDate: string;
  existingPlan?: PlanData;
  onSave: (plan: PlanData) => void;
  onCancel: () => void;
  disabled?: boolean;
}

/**
 * PlanInputForm component - allows users to set planned study time for a specific date
 */
export default function PlanInputForm({
  selectedDate,
  existingPlan,
  onSave,
  onCancel,
  disabled = false,
}: PlanInputFormProps) {
  const [hours, setHours] = useState(existingPlan?.hours.toString() || "0");
  const [minutes, setMinutes] = useState(existingPlan?.minutes.toString() || "0");
  const [error, setError] = useState<string | null>(null);
  const { locale } = useLocale();

  // Real-time validation
  const validationError = useMemo(() => {
    const parsedHours = parseInt(hours, 10);
    const parsedMinutes = parseInt(minutes, 10);
    
    if (Number.isNaN(parsedHours) || parsedHours < 0 || parsedHours > TIME_LIMITS.MAX_HOURS) {
      return `Hours must be between 0 and ${TIME_LIMITS.MAX_HOURS}`;
    }
    
    if (Number.isNaN(parsedMinutes) || parsedMinutes < 0 || parsedMinutes > TIME_LIMITS.MAX_MINUTES) {
      return `Minutes must be between 0 and ${TIME_LIMITS.MAX_MINUTES}`;
    }
    
    return null;
  }, [hours, minutes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Check real-time validation first
    if (validationError) {
      setError(validationError);
      return;
    }
    
    const parsedHours = parseInt(hours, 10);
    const parsedMinutes = parseInt(minutes, 10);

    const plan: PlanData = {
      date: selectedDate,
      hours: Number.isNaN(parsedHours) ? 0 : parsedHours,
      minutes: Number.isNaN(parsedMinutes) ? 0 : parsedMinutes,
    };

    const validation = validatePlanData(plan);
    if (!validation.valid) {
      setError(validation.error || "Invalid plan data");
      return;
    }

    const sanitized = sanitizePlanData(plan);
    setHours(sanitized.hours.toString());
    setMinutes(sanitized.minutes.toString());
    onSave(sanitized);
  };

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onCancel]);

  const dateObj = new Date(selectedDate + "T00:00:00");
  const formattedDate = dateObj.toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 max-w-md mx-auto">
      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Set Planned Study Time</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{formattedDate}</p>

      {(error || validationError) && (
        <div className="mb-4">
          <ErrorMessage message={error || validationError || ""} onDismiss={() => setError(null)} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label
              htmlFor="hours"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Hours
            </label>
            <input
              type="number"
              id="hours"
              min="0"
              max={TIME_LIMITS.MAX_HOURS}
              value={hours}
              onChange={(e) => {
                setHours(e.target.value);
                setError(null);
              }}
              className={`w-full px-4 py-2 border rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         transition-shadow duration-200
                         ${validationError ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-gray-600"}
                         dark:bg-gray-700 dark:text-gray-200`}
              aria-label="Hours"
              aria-required="false"
              aria-invalid={validationError ? "true" : "false"}
            />
          </div>

          <div className="flex-1">
            <label
              htmlFor="minutes"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Minutes
            </label>
            <input
              type="number"
              id="minutes"
              min="0"
              max={TIME_LIMITS.MAX_MINUTES}
              value={minutes}
              onChange={(e) => {
                setMinutes(e.target.value);
                setError(null);
              }}
              className={`w-full px-4 py-2 border rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         transition-shadow duration-200
                         ${validationError ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-gray-600"}
                         dark:bg-gray-700 dark:text-gray-200`}
              aria-label="Minutes"
              aria-required="false"
              aria-invalid={validationError ? "true" : "false"}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={disabled}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg 
                       hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
                       transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Save planned study time"
          >
            {disabled ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={disabled}
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg 
                       hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 
                       transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Cancel"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

