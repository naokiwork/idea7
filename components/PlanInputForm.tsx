"use client";

import { useState } from "react";
import type { PlanData } from "@/types";
import { formatDate } from "@/lib/utils";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;

    if (h < 0 || m < 0 || m >= 60) {
      alert("Please enter valid hours (≥0) and minutes (0-59)");
      return;
    }

    onSave({
      date: selectedDate,
      hours: h,
      minutes: m,
    });
  };

  const dateObj = new Date(selectedDate + "T00:00:00");
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-md mx-auto">
      <h3 className="text-lg font-medium text-gray-800 mb-4">Set Planned Study Time</h3>
      <p className="text-sm text-gray-600 mb-6">{formattedDate}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label
              htmlFor="hours"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Hours
            </label>
            <input
              type="number"
              id="hours"
              min="0"
              max="24"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         transition-shadow duration-200"
              aria-label="Hours"
              aria-required="false"
            />
          </div>

          <div className="flex-1">
            <label
              htmlFor="minutes"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Minutes
            </label>
            <input
              type="number"
              id="minutes"
              min="0"
              max="59"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         transition-shadow duration-200"
              aria-label="Minutes"
              aria-required="false"
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
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg 
                       hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 
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

