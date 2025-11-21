"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import type { StudyRecord } from "@/types";
import { useLocale } from "@/context/LocaleContext";
import { formatDate } from "@/lib/utils";
import { sanitizeStudyRecord, validateStudyRecord } from "@/lib/validation";
import ErrorMessage from "./ErrorMessage";
import { TIMER_CONFIG, MODAL_SIZE, STORAGE_KEYS, TIME_LIMITS } from "@/lib/constants";
import { logWarn } from "@/lib/logger";

const DEFAULT_SIZE = { width: MODAL_SIZE.DEFAULT_WIDTH, height: MODAL_SIZE.DEFAULT_HEIGHT };

type TimerStorageState = {
  isRunning: boolean;
  elapsedSeconds: number;
  startedAt: number | null;
};

const DEFAULT_TIMER_STATE: TimerStorageState = {
  isRunning: false,
  elapsedSeconds: 0,
  startedAt: null,
};

const readStoredTimerState = (): TimerStorageState => {
  if (typeof window === "undefined") {
    return DEFAULT_TIMER_STATE;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.TIMER_STATE);
    if (!raw) {
      return DEFAULT_TIMER_STATE;
    }
    const parsed = JSON.parse(raw) as TimerStorageState;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.elapsedSeconds !== "number" ||
      typeof parsed.isRunning !== "boolean" ||
      (parsed.startedAt !== null && typeof parsed.startedAt !== "number")
    ) {
      return DEFAULT_TIMER_STATE;
    }
    return parsed;
  } catch (error) {
    logWarn("Failed to read timer state", error);
    return DEFAULT_TIMER_STATE;
  }
};

const computeDisplaySeconds = (state: TimerStorageState, now: number) => {
  const base = state.elapsedSeconds;
  if (state.isRunning && state.startedAt) {
    const delta = Math.max(0, (now - state.startedAt) / 1000);
    return base + delta;
  }
  return base;
};

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
  const initialTimerStateRef = useRef<TimerStorageState | null>(null);
  if (initialTimerStateRef.current === null) {
    initialTimerStateRef.current = readStoredTimerState();
  }
  const initialTimerState = initialTimerStateRef.current;

  const [selectedMinutes, setSelectedMinutes] = useState<number[]>([]);
  const [customHours, setCustomHours] = useState("0");
  const [customMinutes, setCustomMinutes] = useState("0");
  const [useCustom, setUseCustom] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time validation for custom input
  const customInputError = useMemo(() => {
    if (!useCustom) return null;
    
    const h = parseInt(customHours, 10);
    const m = parseInt(customMinutes, 10);
    
    if (Number.isNaN(h) || h < 0 || h > TIME_LIMITS.MAX_HOURS) {
      return `Hours must be between 0 and ${TIME_LIMITS.MAX_HOURS}`;
    }
    
    if (Number.isNaN(m) || m < 0 || m > TIME_LIMITS.MAX_MINUTES) {
      return `Minutes must be between 0 and ${TIME_LIMITS.MAX_MINUTES}`;
    }
    
    const totalMinutes = h * 60 + m;
    if (totalMinutes > TIME_LIMITS.MAX_MINUTES_PER_DAY) {
      return `Total time cannot exceed ${TIME_LIMITS.MAX_HOURS} hours`;
    }
    
    return null;
  }, [useCustom, customHours, customMinutes]);
  const [timerState, setTimerState] = useState<TimerStorageState>(initialTimerState);
  const [displaySeconds, setDisplaySeconds] = useState(() =>
    Math.floor(computeDisplaySeconds(initialTimerState, Date.now()))
  );
  const [modalSize, setModalSize] = useState<{ width: number; height: number }>(() => ({ ...DEFAULT_SIZE }));
  const [resizeState, setResizeState] = useState<{
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);
  const { locale } = useLocale();
  const [isMaximized, setIsMaximized] = useState(false);
  const previousSizeRef = useRef<{ width: number; height: number } | null>(null);

  const computeMaximizedSize = useCallback((): { width: number; height: number } => {
    if (typeof window === "undefined") {
      return {
        width: MODAL_SIZE.MAX_WIDTH,
        height: MODAL_SIZE.MAX_HEIGHT,
      };
    }
    return {
      width: Math.min(MODAL_SIZE.MAX_WIDTH, Math.max(MODAL_SIZE.MIN_WIDTH, window.innerWidth - 120)),
      height: Math.min(MODAL_SIZE.MAX_HEIGHT, Math.max(MODAL_SIZE.MIN_HEIGHT, window.innerHeight - 120)),
    };
  }, []);

  const quickSelectOptions = [10, 20, 30, 40, 50, 60] as const; // minutes
  const timerHours = Math.floor(displaySeconds / 3600);
  const timerMinutesPortion = Math.floor((displaySeconds % 3600) / 60);
  const timerSecondsPortion = Math.floor(displaySeconds % 60);
  const timerDisplay = useMemo(() => {
    const hours = Math.floor(displaySeconds / 3600)
      .toString()
      .padStart(2, "0");
    const minutes = Math.floor((displaySeconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const seconds = Math.floor(displaySeconds % 60)
      .toString()
      .padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }, [displaySeconds]);
  const timerProgress = useMemo(() => {
    return (timerSecondsPortion % 60) / 60;
  }, [timerSecondsPortion]);
  const dashOffset = TIMER_CONFIG.CIRCUMFERENCE * (1 - timerProgress);

  const formatMinutesLabel = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) {
      return `${mins}m`;
    }
    if (mins === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${mins}m`;
  };

  const shouldScroll = modalSize.height < 660;
  const timerVisualSize = Math.min(360, Math.max(220, modalSize.width - 200));

  const toggleQuickSelect = (minutes: number) => {
    if (selectedMinutes.includes(minutes)) {
      setSelectedMinutes(selectedMinutes.filter((m) => m !== minutes));
    } else {
      setSelectedMinutes([...selectedMinutes, minutes]);
    }
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Check real-time validation first
    if (customInputError) {
      setError(customInputError);
      return;
    }

    let totalMinutes = 0;

    if (useCustom) {
      const h = parseInt(customHours, 10);
      const m = parseInt(customMinutes, 10);
      const safeHours = Number.isNaN(h) ? 0 : h;
      const safeMinutes = Number.isNaN(m) ? 0 : m;
      totalMinutes = safeHours * 60 + safeMinutes;
    } else {
      totalMinutes = selectedMinutes.reduce((sum, m) => sum + m, 0);
    }

    if (totalMinutes === 0) {
      const timerMinutesRounded = Math.ceil(displaySeconds / 60);
      if (timerMinutesRounded > 0) {
        totalMinutes = timerMinutesRounded;
      }
    }

    if (totalMinutes === 0) {
      setError("Please select or enter study time");
      return;
    }

    const record: StudyRecord = {
      date: selectedDate,
      minutes: totalMinutes,
    };

    const validation = validateStudyRecord(record);
    if (!validation.valid) {
      setError(validation.error || "Invalid record data");
      return;
    }

    const sanitized = sanitizeStudyRecord(record);
    onSave(sanitized);
    resetTimer();
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

  useEffect(() => {
    setDisplaySeconds(Math.floor(computeDisplaySeconds(timerState, Date.now())));
    if (!timerState.isRunning) {
      return;
    }
    const interval = window.setInterval(() => {
      setDisplaySeconds(Math.floor(computeDisplaySeconds(timerState, Date.now())));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerState]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEYS.TIMER_STATE, JSON.stringify(timerState));
    }
  }, [timerState]);

  const toggleTimer = () => {
    setTimerState((prev) => {
      if (prev.isRunning) {
        const elapsed = Math.floor(computeDisplaySeconds(prev, Date.now()));
        return { isRunning: false, elapsedSeconds: elapsed, startedAt: null };
      }
      const elapsed = Math.floor(computeDisplaySeconds(prev, Date.now()));
      return { isRunning: true, elapsedSeconds: elapsed, startedAt: Date.now() };
    });
  };

  const resetTimer = () => {
    setTimerState(DEFAULT_TIMER_STATE);
  };

  const applyTimerResult = () => {
    const roundedMinutes = Math.ceil(displaySeconds / 60);
    if (roundedMinutes <= 0) {
      setError("Start the timer to capture study time");
      return;
    }

    const hours = Math.floor(roundedMinutes / 60);
    const minutes = roundedMinutes % 60;
    setCustomHours(hours.toString());
    setCustomMinutes(minutes.toString());
    setUseCustom(true);
    setSelectedMinutes([]);
    setError(null);
  };

  const handleMinimize = () => {
    previousSizeRef.current = modalSize;
    setIsMaximized(false);
    setModalSize({
      width: MODAL_SIZE.MIN_WIDTH,
      height: MODAL_SIZE.MIN_HEIGHT,
    });
  };

  const toggleMaximize = () => {
    if (isMaximized) {
      const restore = previousSizeRef.current ?? { ...DEFAULT_SIZE };
      setIsMaximized(false);
      setModalSize(restore);
      return;
    }
    previousSizeRef.current = modalSize;
    setIsMaximized(true);
    setModalSize(computeMaximizedSize());
  };

  const handleResizeStart = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    let baseSize = modalSize;
    if (isMaximized) {
      const restore = previousSizeRef.current ?? { ...DEFAULT_SIZE };
      setIsMaximized(false);
      setModalSize(restore);
      baseSize = restore;
    }
    setResizeState({
      startX: event.clientX,
      startY: event.clientY,
      startWidth: baseSize.width,
      startHeight: baseSize.height,
    });
  };

  useEffect(() => {
    if (!resizeState) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const deltaX = event.clientX - resizeState.startX;
      const deltaY = event.clientY - resizeState.startY;

      setModalSize((prev) => {
        const nextWidth = Math.min(Math.max(resizeState.startWidth + deltaX, MODAL_SIZE.MIN_WIDTH), MODAL_SIZE.MAX_WIDTH);
        const nextHeight = Math.min(Math.max(resizeState.startHeight + deltaY, MODAL_SIZE.MIN_HEIGHT), MODAL_SIZE.MAX_HEIGHT);
        if (nextWidth === prev.width && nextHeight === prev.height) {
          return prev;
        }
        return { width: nextWidth, height: nextHeight };
      });
    };

    const handleMouseUp = () => {
      setResizeState(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizeState]);

  useEffect(() => {
    if (!isMaximized) {
      return;
    }

    const handleWindowResize = () => {
      setModalSize(computeMaximizedSize());
    };

    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [isMaximized, computeMaximizedSize]);

  const dateObj = new Date(selectedDate + "T00:00:00");
  const formattedDate = dateObj.toLocaleDateString(locale, {
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
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 relative flex flex-col overflow-hidden"
        style={{
          width: modalSize.width,
          height: modalSize.height,
          maxWidth: "96vw",
          maxHeight: "90vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-400 focus:outline-none focus:ring-2 focus:ring-red-300 transition-colors"
              aria-label="Close"
            />
            <button
              type="button"
              onClick={handleMinimize}
              className="w-3.5 h-3.5 rounded-full bg-amber-400 hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-colors"
              aria-label="Minimize"
            />
            <button
              type="button"
              onClick={toggleMaximize}
              className={`w-3.5 h-3.5 rounded-full focus:outline-none focus:ring-2 transition-colors ${
                isMaximized
                  ? "bg-emerald-500 hover:bg-emerald-400 focus:ring-emerald-300"
                  : "bg-green-500 hover:bg-green-400 focus:ring-green-300"
              }`}
              aria-label={isMaximized ? "Restore size" : "Maximize"}
            />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {isMaximized ? "Full size" : "Resizable"}
          </span>
        </div>

        <h3 id="record-modal-title" className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-1">
          Record Study Time
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{formattedDate}</p>

        {(error || customInputError) && (
          <div className="mb-4">
            <ErrorMessage message={error || customInputError || ""} onDismiss={() => setError(null)} />
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className={`space-y-6 flex-1 overflow-y-auto ${shouldScroll ? "pr-2" : "pr-1"}`}
        >
          {/* Timer */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 text-white">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-white/80 uppercase tracking-wide">Timer</h4>
              <span className="text-xs text-white/50">{timerState.isRunning ? "Running" : "Paused"}</span>
            </div>
            <div className="flex flex-col items-center gap-6">
              <div
                className="relative"
                style={{ width: `${timerVisualSize}px`, height: `${timerVisualSize}px` }}
              >
                <svg className="w-full h-full" viewBox="0 0 220 220">
                  <circle
                    cx="110"
                    cy="110"
                    r={TIMER_CONFIG.RADIUS}
                    stroke="#2d3748"
                    strokeWidth="12"
                    fill="transparent"
                  />
                  <circle
                    cx="110"
                    cy="110"
                    r={TIMER_CONFIG.RADIUS}
                    stroke="#f97316"
                    strokeWidth="12"
                    strokeLinecap="round"
                    fill="transparent"
                    strokeDasharray={`${TIMER_CONFIG.CIRCUMFERENCE} ${TIMER_CONFIG.CIRCUMFERENCE}`}
                    strokeDashoffset={dashOffset}
                    transform="rotate(-90 110 110)"
                    style={{ transition: "stroke-dashoffset 0.4s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-semibold font-mono tracking-tight">{timerDisplay}</span>
                  <div className="mt-2 text-xs text-white/60 uppercase tracking-widest">
                    {timerHours}h {timerMinutesPortion}m recorded
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-3 w-full">
                <button
                  type="button"
                  onClick={resetTimer}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-white/90 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={toggleTimer}
                  className={`px-6 py-2 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    timerState.isRunning
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                      : "bg-green-500 hover:bg-green-400 text-white"
                  }`}
                >
                  {timerState.isRunning ? "Pause" : displaySeconds === 0 ? "Start" : "Resume"}
                </button>
                <button
                  type="button"
                  onClick={applyTimerResult}
                  className="px-4 py-2 rounded-lg border border-emerald-400 text-emerald-200 hover:bg-emerald-500/10 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  Use Timer Time
                </button>
              </div>
            </div>
          </div>

          {/* Quick Select Buttons */}
          {!useCustom && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
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
                          : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm"
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
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  Total: {formatMinutesLabel(totalQuickSelect)}
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
              <label htmlFor="use-custom" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enter custom time
              </label>
            </div>

            {useCustom && (
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label
                    htmlFor="custom-hours"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Hours
                  </label>
                  <input
                    type="number"
                    id="custom-hours"
                    min="0"
                    max={TIME_LIMITS.MAX_HOURS}
                    value={customHours}
                    onChange={(e) => {
                      setCustomHours(e.target.value);
                      setError(null);
                    }}
                    className={`w-full px-4 py-2 border rounded-lg 
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                               transition-shadow duration-200
                               ${customInputError ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-gray-600"}
                               dark:bg-gray-700 dark:text-gray-200`}
                    aria-label="Custom hours"
                    aria-invalid={customInputError ? "true" : "false"}
                  />
                </div>

                <div className="flex-1">
                  <label
                    htmlFor="custom-minutes"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Minutes
                  </label>
                  <input
                    type="number"
                    id="custom-minutes"
                    min="0"
                    max={TIME_LIMITS.MAX_MINUTES}
                    value={customMinutes}
                    onChange={(e) => {
                      setCustomMinutes(e.target.value);
                      setError(null);
                    }}
                    className={`w-full px-4 py-2 border rounded-lg 
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                               transition-shadow duration-200
                               ${customInputError ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-gray-600"}
                               dark:bg-gray-700 dark:text-gray-200`}
                    aria-label="Custom minutes"
                    aria-invalid={customInputError ? "true" : "false"}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 sticky bottom-0 bg-white dark:bg-gray-800 pb-3 border-t border-gray-200 dark:border-gray-700 z-10">
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
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg 
                         hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 
                         transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Cancel"
            >
              Cancel
            </button>
          </div>
        </form>
        <div
          className="absolute bottom-2 right-2 w-4 h-4 cursor-se-resize"
          onMouseDown={handleResizeStart}
          role="presentation"
        >
          <div className="w-full h-full border-b-2 border-r-2 border-gray-300 dark:border-gray-600 rounded-br-sm pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

