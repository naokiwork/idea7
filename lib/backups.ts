import type { StudyRecord, PlanData, StudySession } from "@/types";

export interface BackupSnapshot {
  id: string;
  createdAt: string; // ISO timestamp
  records: StudyRecord[];
  plans: PlanData[];
  sessions?: StudySession[];
  note?: string;
}

const STORAGE_KEY = "study-backups";
const DEFAULT_MAX_BACKUPS = 20;

function getWindow(): Window | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window;
}

export function loadBackups(): BackupSnapshot[] {
  const win = getWindow();
  if (!win) {
    return [];
  }

  try {
    const stored = win.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored) as BackupSnapshot[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch (error) {
    console.error("Failed to load backups:", error);
    return [];
  }
}

export function saveBackups(backups: BackupSnapshot[]): void {
  const win = getWindow();
  if (!win) {
    return;
  }
  try {
    win.localStorage.setItem(STORAGE_KEY, JSON.stringify(backups));
  } catch (error) {
    console.error("Failed to persist backups:", error);
  }
}

function areArraysEqual<T>(a: T[] = [], b: T[] = []): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return JSON.stringify(a) === JSON.stringify(b);
}

function isDuplicateSnapshot(snapshot: BackupSnapshot, backups: BackupSnapshot[]): boolean {
  if (backups.length === 0) {
    return false;
  }

  const latest = backups[0];
  return (
    areArraysEqual(snapshot.records, latest.records) &&
    areArraysEqual(snapshot.plans, latest.plans) &&
    areArraysEqual(snapshot.sessions, latest.sessions)
  );
}

export function createSnapshot(
  records: StudyRecord[],
  plans: PlanData[],
  sessions: StudySession[] = [],
  options?: { note?: string; maxBackups?: number }
): BackupSnapshot[] {
  const existing = loadBackups();
  const maxBackups = options?.maxBackups ?? DEFAULT_MAX_BACKUPS;

  const snapshot: BackupSnapshot = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    records: JSON.parse(JSON.stringify(records)),
    plans: JSON.parse(JSON.stringify(plans)),
    sessions: JSON.parse(JSON.stringify(sessions)),
    note: options?.note,
  };

  if (isDuplicateSnapshot(snapshot, existing)) {
    return existing;
  }

  const updated = [snapshot, ...existing].slice(0, Math.max(1, maxBackups));
  saveBackups(updated);
  return updated;
}

export function clearBackups(): void {
  saveBackups([]);
}

export function deleteBackup(id: string): BackupSnapshot[] {
  const existing = loadBackups();
  const updated = existing.filter((backup) => backup.id !== id);
  saveBackups(updated);
  return updated;
}

function generateId(): string {
  const win = getWindow();
  if (win?.crypto?.randomUUID) {
    return win.crypto.randomUUID();
  }
  return `backup-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
}

