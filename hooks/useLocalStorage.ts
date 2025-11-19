"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook for localStorage with React state synchronization
 * @param key localStorage key
 * @param initialValue Default value if key doesn't exist
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
    setHasHydrated(true);
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      setStoredValue((prev) => {
        const valueToStore = value instanceof Function ? value(prev) : value;
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
        return valueToStore;
      });
      setHasHydrated(true);
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Until initialized, return the initial value to keep SSR/CSR markup in sync
  return [hasHydrated ? storedValue : initialValue, setValue];
}

