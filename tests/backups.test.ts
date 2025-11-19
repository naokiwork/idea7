import { describe, it, expect, beforeEach } from "vitest";
import {
  createSnapshot,
  loadBackups,
  deleteBackup,
  clearBackups,
} from "@/lib/backups";
import type { PlanData, StudyRecord } from "@/types";

const sampleRecords: StudyRecord[] = [
  { date: "2025-01-01", minutes: 60 },
  { date: "2025-01-02", minutes: 90 },
];

const samplePlans: PlanData[] = [
  { date: "2025-01-01", hours: 1, minutes: 0 },
  { date: "2025-01-02", hours: 1, minutes: 30 },
];

beforeEach(() => {
  clearBackups();
});

describe("backup snapshots", () => {
  it("creates a snapshot and persists it", () => {
    const snapshots = createSnapshot(sampleRecords, samplePlans, { note: "initial" });

    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].note).toBe("initial");

    const stored = loadBackups();
    expect(stored).toHaveLength(1);
    expect(stored[0].records).toHaveLength(sampleRecords.length);
    expect(stored[0].plans).toHaveLength(samplePlans.length);
  });

  it("does not duplicate identical snapshots", () => {
    createSnapshot(sampleRecords, samplePlans);
    const second = createSnapshot(sampleRecords, samplePlans);

    expect(second).toHaveLength(1);
  });

  it("respects the max backup limit", () => {
    createSnapshot(sampleRecords, samplePlans, { note: "1", maxBackups: 3 });
    createSnapshot(sampleRecords, [{ date: "2025-01-03", hours: 2, minutes: 0 }], { note: "2", maxBackups: 3 });
    createSnapshot(sampleRecords, [{ date: "2025-01-04", hours: 2, minutes: 0 }], { note: "3", maxBackups: 3 });
    const last = createSnapshot(sampleRecords, [{ date: "2025-01-05", hours: 2, minutes: 0 }], { note: "4", maxBackups: 3 });

    expect(last).toHaveLength(3);
    expect(last[0].note).toBe("4");
    expect(last.at(-1)?.note).toBe("2");
  });

  it("deletes backups by id", () => {
    const snapshots = createSnapshot(sampleRecords, samplePlans);
    const id = snapshots[0].id;

    const afterDelete = deleteBackup(id);
    expect(afterDelete).toHaveLength(0);
    expect(loadBackups()).toHaveLength(0);
  });
});
