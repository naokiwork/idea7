"use client";

import { useState, useEffect } from "react";
import type { PlanData } from "@/types";
import { formatDate, getDatesInRange } from "@/lib/utils";
import ErrorMessage from "./ErrorMessage";

interface BulkOperationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plans: PlanData[]) => void;
}

/**
 * BulkOperationModal component - allows setting plans for multiple days at once
 */
export default function BulkOperationModal({
  isOpen,
  onClose,
  onSave,
}: BulkOperationModalProps) {
  const [fromDate, setFromDate] = useState(formatDate(new Date()));
  const [toDate, setToDate] = useState(formatDate(new Date()));
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("0");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setFromDate(formatDate(new Date()));
      setToDate(formatDate(new Date()));
      setHours("0");
      setMinutes("0");
      setError(null);
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;

    if (h < 0 || h > 24) {
      setError("Hours must be between 0 and 24");
      return;
    }

    if (m < 0 || m >= 60) {
      setError("Minutes must be between 0 and 59");
      return;
    }

    const from = new Date(fromDate + "T00:00:00");
    const to = new Date(toDate + "T00:00:00");

    if (from > to) {
      setError("Start date must be before or equal to end date");
      return;
    }

    const dates = getDatesInRange(from, to);
    const plans: PlanData[] = dates.map((date) => ({
      date,
      hours: h,
      minutes: m,
    }));

    onSave(plans);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-operation-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="bulk-operation-title" className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
          Bulk Set Plans
        </h3>

        {error && (
          <div className="mb-4">
            <ErrorMessage message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="bulk-from-date"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                From Date
              </label>
              <input
                type="date"
                id="bulk-from-date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition-shadow duration-200"
                aria-label="Start date"
                required
              />
            </div>
            <div>
              <label
                htmlFor="bulk-to-date"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                To Date
              </label>
              <input
                type="date"
                id="bulk-to-date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition-shadow duration-200"
                aria-label="End date"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label
                htmlFor="bulk-hours"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Hours
              </label>
              <input
                type="number"
                id="bulk-hours"
                min="0"
                max="24"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition-shadow duration-200"
                aria-label="Hours"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="bulk-minutes"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Minutes
              </label>
              <input
                type="number"
                id="bulk-minutes"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition-shadow duration-200"
                aria-label="Minutes"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg 
                         hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
                         transition-colors duration-200 font-medium"
              aria-label="Apply bulk operation"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={onClose}
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

