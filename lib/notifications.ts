/**
 * Notification utilities
 */

/**
 * Request browser notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

/**
 * Show notification
 */
export function showNotification(
  title: string,
  options?: NotificationOptions
): Notification | null {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return null;
  }

  const notification = new Notification(title, {
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    ...options,
  });

  return notification;
}

/**
 * Check if notifications are supported
 */
export function isNotificationSupported(): boolean {
  return "Notification" in window;
}

/**
 * Check if notifications are permitted
 */
export function isNotificationPermitted(): boolean {
  return isNotificationSupported() && Notification.permission === "granted";
}

