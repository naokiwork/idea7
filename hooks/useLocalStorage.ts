"use client";

import { useState, useEffect, useCallback } from "react";
import { logError } from "@/lib/logger";

export interface UseLocalStorageOptions {
  /** Callback when an error occurs during read/write operations */
  onError?: (error: Error, operation: "read" | "write") => void;
  /** Validate data before storing (return false to reject) */
  validate?: (value: unknown) => boolean;
  /** Transform data when reading (useful for migrations) */
  transform?: (value: unknown) => T;
}

/**
 * Custom hook for localStorage with React state synchronization
 * @param key localStorage key
 * @param initialValue Default value if key doesn't exist
 * @param options Optional configuration for error handling and validation
 * @returns Tuple of [value, setValue] for backward compatibility
 * 
 * @example
 * ```tsx
 * const [records, setRecords] = useLocalStorage<StudyRecord[]>("study-records", []);
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: UseLocalStorageOptions
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        let parsed: unknown = JSON.parse(item);
        
        // Apply transform if provided
        if (options?.transform) {
          try {
            parsed = options.transform(parsed);
          } catch (transformError) {
            logError(`Error transforming localStorage value for "${key}":`, transformError);
            const err = transformError instanceof Error ? transformError : new Error(String(transformError));
            setError(err);
            if (options.onError) {
              options.onError(err, "read");
            }
            return;
          }
        }

        // Validate if provided
        if (options?.validate && !options.validate(parsed)) {
          logError(`Invalid data format for localStorage key "${key}", using initial value`);
          const err = new Error(`Invalid data format for key "${key}"`);
          setError(err);
          if (options.onError) {
            options.onError(err, "read");
          }
          return;
        }

        setStoredValue(parsed as T);
      }
    } catch (error) {
      logError(`Error reading localStorage key "${key}":`, error);
      const err = error instanceof Error ? error : new Error(String(error));
      setError(err);
      if (options?.onError) {
        options.onError(err, "read");
      }
    }
    setHasHydrated(true);
  }, [key, options]);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        setStoredValue((prev) => {
          const valueToStore = value instanceof Function ? value(prev) : value;
          
          // Validate if provided
          if (options?.validate && !options.validate(valueToStore)) {
            const err = new Error(`Invalid data format for key "${key}"`);
            setError(err);
            if (options.onError) {
              options.onError(err, "write");
            }
            return prev; // Reject the change
          }

          if (typeof window !== "undefined") {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
          }
          setError(null); // Clear error on successful write
          return valueToStore;
        });
        setHasHydrated(true);
      } catch (error) {
        logError(`Error setting localStorage key "${key}":`, error);
        const err = error instanceof Error ? error : new Error(String(error));
        setError(err);
        if (options?.onError) {
          options.onError(err, "write");
        }
      }
    },
    [key, options]
  );

  // Until initialized, return the initial value to keep SSR/CSR markup in sync
  return [hasHydrated ? storedValue : initialValue, setValue];
}

