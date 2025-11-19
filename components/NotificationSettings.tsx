"use client";

import { useState, useEffect } from "react";
import {
  requestNotificationPermission,
  isNotificationSupported,
  isNotificationPermitted,
  showNotification,
} from "@/lib/notifications";

interface NotificationSettingsProps {
  onGoalReminderChange?: (enabled: boolean) => void;
}

/**
 * NotificationSettings component - manages notification preferences
 */
export default function NotificationSettings({
  onGoalReminderChange,
}: NotificationSettingsProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isPermitted, setIsPermitted] = useState(false);
  const [goalReminder, setGoalReminder] = useState(false);

  useEffect(() => {
    setIsSupported(isNotificationSupported());
    setIsPermitted(isNotificationPermitted());
  }, []);

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setIsPermitted(granted);
    if (granted) {
      showNotification("Notifications enabled!", {
        body: "You will now receive study reminders.",
      });
    }
  };

  const handleTestNotification = () => {
    if (isPermitted) {
      showNotification("Test Notification", {
        body: "This is a test notification from Study Hour Calendar.",
      });
    }
  };

  const handleGoalReminderToggle = (enabled: boolean) => {
    setGoalReminder(enabled);
    onGoalReminderChange?.(enabled);
  };

  if (!isSupported) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
          Notifications
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Your browser does not support notifications.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
        Notifications
      </h3>

      <div className="space-y-4">
        {/* Permission Status */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Browser Permission
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isPermitted ? "Granted" : "Not granted"}
            </p>
          </div>
          {!isPermitted && (
            <button
              onClick={handleRequestPermission}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg 
                         hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
                         transition-colors duration-200 text-sm font-medium"
              aria-label="Request notification permission"
            >
              Enable
            </button>
          )}
        </div>

        {/* Goal Reminder */}
        {isPermitted && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Goal Reminder
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Get notified when you have not reached your daily goal
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={goalReminder}
                onChange={(e) => handleGoalReminderToggle(e.target.checked)}
                className="sr-only peer"
                aria-label="Toggle goal reminder"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        )}

        {/* Test Notification */}
        {isPermitted && (
          <button
            onClick={handleTestNotification}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg 
                       hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 
                       transition-colors duration-200 text-sm font-medium"
            aria-label="Test notification"
          >
            Test Notification
          </button>
        )}
      </div>
    </div>
  );
}

