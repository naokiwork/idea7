"use client";

import { useState, useEffect } from "react";
import type { StudyRecord } from "@/types";
import { useLocale } from "@/context/LocaleContext";
import { sanitizeStudyRecord, validateStudyRecord } from "@/lib/validation";

interface EditRecordModalProps {
  date: string;
  initialHours: number;
  initialMinutes: number;
  onSave: (hours: number, minutes: number) => void;
  onCancel: () => void;
}

/**
 * EditRecordModal component - modern UI for editing study time
 * Replaces prompt/alert with a proper modal
 */
export default function EditRecordModal({
  date,
  initialHours,
  initialMinutes,
  onSave,
  onCancel,
}: EditRecordModalProps) {
  const [hours, setHours] = useState(initialHours.toString());
  const [minutes, setMinutes] = useState(initialMinutes.toString());
  const [error, setError] = useState<string | null>(null);
  const { locale } = useLocale();

  useEffect(() => {
    setHours(initialHours.toString());
    setMinutes(initialMinutes.toString());
    setError(null);
  }, [initialHours, initialMinutes]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedHours = parseInt(hours, 10);
    const parsedMinutes = parseInt(minutes, 10);
    const safeHours = Number.isNaN(parsedHours) ? 0 : parsedHours;
    const safeMinutes = Number.isNaN(parsedMinutes) ? 0 : parsedMinutes;

    const record: StudyRecord = {
      date,
      minutes: safeHours * 60 + safeMinutes,
    };

    const validation = validateStudyRecord(record);
    if (!validation.valid) {
      setError(validation.error || "Invalid study time");
      return;
    }

    const sanitized = sanitizeStudyRecord(record);
    const sanitizedHours = Math.floor(sanitized.minutes / 60);
    const sanitizedMinutes = sanitized.minutes % 60;
    setHours(sanitizedHours.toString());
    setMinutes(sanitizedMinutes.toString());
    onSave(sanitizedHours, sanitizedMinutes);
  };

  const dateObj = new Date(date + "T00:00:00");
  const formattedDate = dateObj.toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-record-modal-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="edit-record-modal-title" className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
          Edit Study Time
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{formattedDate}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
              <div className="flex-1">
                <label
                  htmlFor="edit-hours"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Hours
                </label>
                <input
                  type="number"
                  id="edit-hours"
                  min="0"
                  max="24"
                  value={hours}
                  onChange={(e) => {
                    setHours(e.target.value);
                    setError(null);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg 
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             transition-shadow duration-200"
                  aria-label="Hours"
                  aria-required="true"
                />
              </div>

              <div className="flex-1">
                <label
                  htmlFor="edit-minutes"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Minutes
                </label>
                <input
                  type="number"
                  id="edit-minutes"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => {
                    setMinutes(e.target.value);
                    setError(null);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg 
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             transition-shadow duration-200"
                  aria-label="Minutes"
                  aria-required="true"
                />
              </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg 
                         hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
                         transition-colors duration-200 font-medium"
              aria-label="Save edited study time"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg 
                         hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 
                         transition-colors duration-200 font-medium"
              aria-label="Cancel"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

