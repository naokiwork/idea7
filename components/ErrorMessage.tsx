"use client";

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
}

/**
 * ErrorMessage component - displays error messages with dismiss functionality
 * Replaces alert() calls for better UX
 */
export default function ErrorMessage({ message, onDismiss }: ErrorMessageProps) {
  return (
    <div
      className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg flex items-center justify-between"
      role="alert"
      aria-live="polite"
    >
      <span>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 ml-2"
          aria-label="Dismiss error"
        >
          ×
        </button>
      )}
    </div>
  );
}

