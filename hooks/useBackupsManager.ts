"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createSnapshot, deleteBackup, loadBackups, clearBackups } from "@/lib/backups";
import { generateId } from "@/lib/utils";
import type { BackupSnapshot } from "@/lib/backups";
import type { PlanData, StudyRecord, StudySession } from "@/types";
import { sanitizePlanData, sanitizeStudyRecord } from "@/lib/validation";
import { logError, logWarn } from "@/lib/logger";

const RESTORE_CONTEXT_KEY = "study-restore-context";
const RESTORE_NOTICE_TTL_MS = 5 * 60 * 1000; // 5 minutes

type RestoreContext = {
  previousRecords: StudyRecord[];
  previousPlans: PlanData[];
  previousSessions: StudySession[];
  backupId: string;
  appliedAt: string;
  expiresAt: string;
} | null;

interface UseBackupsManagerParams {
  records: StudyRecord[];
  plans: PlanData[];
  sessions: StudySession[];
  setRecords: (records: StudyRecord[]) => void;
  setPlans: (plans: PlanData[]) => void;
  setSessions: (sessions: StudySession[]) => void;
  setError: (message: string | null) => void;
}

export function useBackupsManager({
  records,
  plans,
  sessions,
  setRecords,
  setPlans,
  setSessions,
  setError,
}: UseBackupsManagerParams) {
  const [backups, setBackups] = useState<BackupSnapshot[]>([]);
  const [restoreContext, setRestoreContext] = useState<RestoreContext>(null);

  const recordsRef = useRef(records);
  const plansRef = useRef(plans);
  const sessionsRef = useRef(sessions);

  useEffect(() => {
    recordsRef.current = records;
  }, [records]);

  useEffect(() => {
    plansRef.current = plans;
  }, [plans]);

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  useEffect(() => {
    setBackups(loadBackups());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const stored = window.localStorage.getItem(RESTORE_CONTEXT_KEY);
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored) as RestoreContext;
      if (!parsed) {
        window.localStorage.removeItem(RESTORE_CONTEXT_KEY);
        return;
      }

      if (parsed && "previousSessions" in parsed === false) {
        (parsed as any).previousSessions = [];
      }

      const expiresAt = parsed.expiresAt ? new Date(parsed.expiresAt).getTime() : NaN;
      if (Number.isNaN(expiresAt) || expiresAt <= Date.now()) {
        window.localStorage.removeItem(RESTORE_CONTEXT_KEY);
        return;
      }

      setRestoreContext(parsed);
    } catch (error) {
      logError("Failed to load restore context", error);
      window.localStorage.removeItem(RESTORE_CONTEXT_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (restoreContext) {
      window.localStorage.setItem(RESTORE_CONTEXT_KEY, JSON.stringify(restoreContext));
    } else {
      window.localStorage.removeItem(RESTORE_CONTEXT_KEY);
    }
  }, [restoreContext]);

  useEffect(() => {
    if (!restoreContext) {
      return;
    }

    const expiresAt = new Date(restoreContext.expiresAt).getTime();
    if (Number.isNaN(expiresAt)) {
      return;
    }

    if (expiresAt <= Date.now()) {
      setRestoreContext(null);
      return;
    }

    const timeout = window.setTimeout(() => {
      setRestoreContext(null);
    }, expiresAt - Date.now());

    return () => window.clearTimeout(timeout);
  }, [restoreContext]);

  const createBackupSnapshot = useCallback(
    (
      nextRecords: StudyRecord[],
      nextPlans: PlanData[],
      nextSessions?: StudySession[],
      note?: string
    ) => {
      const updated = createSnapshot(
        nextRecords,
        nextPlans,
        nextSessions ?? sessionsRef.current,
        { note }
      );
      setBackups(updated);
    },
    []
  );

  const backupNow = useCallback(
    (note?: string) => {
      createBackupSnapshot(
        recordsRef.current,
        plansRef.current,
        sessionsRef.current,
        note ?? "Manual backup"
      );
      setError(null);
    },
    [createBackupSnapshot, setError]
  );

  const deleteBackupById = useCallback(
    (id: string) => {
      const updated = deleteBackup(id);
      setBackups(updated);
      if (restoreContext?.backupId === id) {
        setRestoreContext(null);
      }
      setError(null);
    },
    [restoreContext, setError]
  );

  const deleteAllBackups = useCallback(() => {
    clearBackups();
    setBackups([]);
    setRestoreContext(null);
    setError(null);
  }, [setError]);

  const applyRestoreContext = useCallback((context: NonNullable<RestoreContext>) => {
    const expiresAt = new Date(new Date(context.appliedAt).getTime() + RESTORE_NOTICE_TTL_MS);
    setRestoreContext({ ...context, expiresAt: expiresAt.toISOString() });
  }, []);

  const restoreBackup = useCallback(
    (backupId: string) => {
      const snapshot = backups.find((backup) => backup.id === backupId);
      if (!snapshot) {
        logWarn(`Backup with id ${backupId} not found.`);
        return;
      }

      const previousRecords = JSON.parse(JSON.stringify(recordsRef.current));
      const previousPlans = JSON.parse(JSON.stringify(plansRef.current));
      const previousSessions = JSON.parse(JSON.stringify(sessionsRef.current));

      createBackupSnapshot(
        recordsRef.current,
        plansRef.current,
        sessionsRef.current,
        "Auto backup before restore"
      );

      const sanitizedRecords = snapshot.records.map((record) => sanitizeStudyRecord(record));
      const sanitizedPlans = snapshot.plans.map((plan) => sanitizePlanData(plan));
      const sanitizedSessions = (snapshot.sessions ?? []).map((session) => ({
        id: session.id ?? generateId("log"),
        date: session.date,
        kind: session.kind === "plan" ? "plan" : "actual",
        minutes: Math.max(0, Math.min(session.minutes ?? 0, 24 * 60)),
        previousMinutes: Math.max(0, Math.min(session.previousMinutes ?? 0, 24 * 60)),
        recordedAt: session.recordedAt ?? new Date().toISOString(),
        source: session.source,
      }));

      setRecords(JSON.parse(JSON.stringify(sanitizedRecords)));
      setPlans(JSON.parse(JSON.stringify(sanitizedPlans)));
      setSessions(JSON.parse(JSON.stringify(sanitizedSessions)));

      applyRestoreContext({
        previousRecords,
        previousPlans,
        previousSessions,
        backupId: snapshot.id,
        appliedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + RESTORE_NOTICE_TTL_MS).toISOString(),
      });
      setError(null);
    },
    [applyRestoreContext, backups, createBackupSnapshot, setError, setPlans, setRecords]
  );

  const undoRestore = useCallback(() => {
    if (!restoreContext) {
      return;
    }

    const restoredRecords = JSON.parse(JSON.stringify(restoreContext.previousRecords));
    const restoredPlans = JSON.parse(JSON.stringify(restoreContext.previousPlans));
    const restoredSessions = JSON.parse(JSON.stringify(restoreContext.previousSessions));

    setRecords(restoredRecords);
    setPlans(restoredPlans);
    setSessions(restoredSessions);
    createBackupSnapshot(restoredRecords, restoredPlans, restoredSessions, "Restore undone");
    setRestoreContext(null);
    setError(null);
  }, [createBackupSnapshot, restoreContext, setError, setPlans, setRecords, setSessions]);

  const dismissRestoreBanner = useCallback(() => {
    setRestoreContext(null);
  }, []);

  return useMemo(
    () => ({
      backups,
      restoreContext,
      createBackupSnapshot,
      backupNow,
      deleteBackupById,
      deleteAllBackups,
      restoreBackup,
      undoRestore,
      dismissRestoreBanner,
    }),
    [
      backupNow,
      backups,
      createBackupSnapshot,
      deleteAllBackups,
      deleteBackupById,
      dismissRestoreBanner,
      restoreBackup,
      restoreContext,
      undoRestore,
    ]
  );
}
