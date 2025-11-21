"use client";

import { useState, useEffect, useCallback } from "react";
import type { StudyRecord, PlanData } from "@/types";
import { recordsAPI, plansAPI } from "@/lib/api";
import { logError } from "@/lib/logger";

/**
 * Custom hook for managing study data from API
 * Replaces localStorage-based data management
 */
export function useStudyData() {
  const [records, setRecords] = useState<StudyRecord[]>([]);
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [recordsData, plansData] = await Promise.all([
        recordsAPI.getAll(),
        plansAPI.getAll(),
      ]);
      setRecords(recordsData);
      setPlans(plansData);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
      logError("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Add or update record
  const addRecord = useCallback(async (record: StudyRecord) => {
    try {
      const updated = await recordsAPI.create(record);
      // Update local state - if record exists, update it; otherwise add it
      setRecords((prev) => {
        const existingIndex = prev.findIndex((r) => r.date === record.date);
        if (existingIndex >= 0) {
          const newRecords = [...prev];
          newRecords[existingIndex] = updated;
          return newRecords;
        }
        return [...prev, updated];
      });
      return updated;
    } catch (err: any) {
      setError(err.message || "Failed to add record");
      throw err;
    }
  }, []);

  // Update record
  const updateRecord = useCallback(async (date: string, minutes: number) => {
    try {
      const updated = await recordsAPI.update(date, minutes);
      setRecords((prev) =>
        prev.map((r) => (r.date === date ? updated : r))
      );
      return updated;
    } catch (err: any) {
      setError(err.message || "Failed to update record");
      throw err;
    }
  }, []);

  // Delete record
  const deleteRecord = useCallback(async (date: string) => {
    try {
      await recordsAPI.delete(date);
      setRecords((prev) => prev.filter((r) => r.date !== date));
    } catch (err: any) {
      setError(err.message || "Failed to delete record");
      throw err;
    }
  }, []);

  // Add or update plan
  const addPlan = useCallback(async (plan: PlanData) => {
    try {
      const updated = await plansAPI.create(plan);
      setPlans((prev) => {
        const existingIndex = prev.findIndex((p) => p.date === plan.date);
        if (existingIndex >= 0) {
          const newPlans = [...prev];
          newPlans[existingIndex] = updated;
          return newPlans;
        }
        return [...prev, updated];
      });
      return updated;
    } catch (err: any) {
      setError(err.message || "Failed to add plan");
      throw err;
    }
  }, []);

  // Update plan
  const updatePlan = useCallback(async (date: string, hours: number, minutes: number) => {
    try {
      const updated = await plansAPI.update(date, hours, minutes);
      setPlans((prev) =>
        prev.map((p) => (p.date === date ? updated : p))
      );
      return updated;
    } catch (err: any) {
      setError(err.message || "Failed to update plan");
      throw err;
    }
  }, []);

  // Delete plan
  const deletePlan = useCallback(async (date: string) => {
    try {
      await plansAPI.delete(date);
      setPlans((prev) => prev.filter((p) => p.date !== date));
    } catch (err: any) {
      setError(err.message || "Failed to delete plan");
      throw err;
    }
  }, []);

  return {
    records,
    plans,
    loading,
    error,
    loadData,
    addRecord,
    updateRecord,
    deleteRecord,
    addPlan,
    updatePlan,
    deletePlan,
  };
}

