/**
 * Logger utility - provides environment-aware logging
 * In production, logs are disabled unless explicitly enabled via NEXT_PUBLIC_ENABLE_LOGS
 */

import { ENABLE_CONSOLE_LOGS } from "./constants";

/**
 * Log a message to console (only in development or if explicitly enabled)
 */
export function log(...args: unknown[]): void {
  if (ENABLE_CONSOLE_LOGS) {
    console.log(...args);
  }
}

/**
 * Log an error to console (always enabled for error tracking)
 */
export function logError(...args: unknown[]): void {
  console.error(...args);
}

/**
 * Log a warning to console (always enabled for important warnings)
 */
export function logWarn(...args: unknown[]): void {
  console.warn(...args);
}

