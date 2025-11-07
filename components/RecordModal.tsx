"use client";

import { useState } from "react";
import type { StudyRecord } from "@/types";
import { formatDate } from "@/lib/utils";

interface RecordModalProps {
  selectedDate: string;
  onSave: (record: StudyRecord) => void;
  onCancel: () => void;
  disabled?: boolean;
}

/**
 * RecordModal component - allows users to record study time with quick-select buttons or manual input
 */
export default function RecordModal({
  selectedDate,
  onSave,
  onCancel,
  disabled = false,
}: RecordModalProps) {
  const [selectedMinutes, setSelectedMinutes] = useState<number[]>([]);
  const [customHours, setCustomHours] = useState("0");
  const [customMinutes, setCustomMinutes] = useState("0");
  const [useCustom, setUseCustom] = useState(false);

  const quickSelectOptions = [10, 20, 30, 40, 50, 60]; // minutes

  const toggleQuickSelect = (minutes: number) => {
    if (selectedMinutes.includes(minutes)) {
      setSelectedMinutes(selectedMinutes.filter((m) => m !== minutes));
    } else {
      setSelectedMinutes([...selectedMinutes, minutes]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let totalMinutes = 0;

    if (useCustom) {
      const h = parseInt(customHours) || 0;
      const m = parseInt(customMinutes) || 0;
      if (h < 0 || m < 0 || m >= 60) {
        alert("Please enter valid hours (≥0) and minutes (0-59)");
        return;
      }
      totalMinutes = h * 60 + m;
    } else {
      totalMinutes = selectedMinutes.reduce((sum, m) => sum + m, 0);
    }

    if (totalMinutes === 0) {
      alert("Please select or enter study time");
      return;
    }

    onSave({
      date: selectedDate,
      minutes: totalMinutes,
    });
  };

  const dateObj = new Date(selectedDate + "T00:00:00");
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const totalQuickSelect = selectedMinutes.reduce((sum, m) => sum + m, 0);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-modal-title"
    >
      <div
        className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="record-modal-title" className="text-lg font-medium text-gray-800 mb-4">
          Record Study Time
        </h3>
        <p className="text-sm text-gray-600 mb-6">{formattedDate}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quick Select Buttons */}
          {!useCustom && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Quick Select (minutes)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {quickSelectOptions.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => toggleQuickSelect(minutes)}
                    className={`
                      px-4 py-2 rounded-lg border-2 transition-all duration-200
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${
                        selectedMinutes.includes(minutes)
                          ? "bg-blue-600 text-white border-blue-600 shadow-md"
                          : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:shadow-sm"
                      }
                    `}
                    aria-label={`Select ${minutes} minutes`}
                    aria-pressed={selectedMinutes.includes(minutes)}
                  >
                    {minutes} min
                  </button>
                ))}
              </div>
              {totalQuickSelect > 0 && (
                <p className="mt-3 text-sm text-gray-600">
                  Total: {Math.floor(totalQuickSelect / 60)}h {totalQuickSelect % 60}m
                </p>
              )}
            </div>
          )}

          {/* Custom Input */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="use-custom"
                checked={useCustom}
                onChange={(e) => {
                  setUseCustom(e.target.checked);
                  if (e.target.checked) {
                    setSelectedMinutes([]);
                  }
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                aria-label="Use custom time input"
              />
              <label htmlFor="use-custom" className="text-sm font-medium text-gray-700">
                Enter custom time
              </label>
            </div>

            {useCustom && (
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label
                    htmlFor="custom-hours"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Hours
                  </label>
                  <input
                    type="number"
                    id="custom-hours"
                    min="0"
                    max="24"
                    value={customHours}
                    onChange={(e) => setCustomHours(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                               transition-shadow duration-200"
                    aria-label="Custom hours"
                  />
                </div>

                <div className="flex-1">
                  <label
                    htmlFor="custom-minutes"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Minutes
                  </label>
                  <input
                    type="number"
                    id="custom-minutes"
                    min="0"
                    max="59"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                               transition-shadow duration-200"
                    aria-label="Custom minutes"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={disabled}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg 
                         hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
                         transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Save study record"
            >
              {disabled ? "Recording..." : "Record"}
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
    </div>
  );
}

