"use client";

import { useMemo, useState } from "react";
import type { BackupSnapshot } from "@/lib/backups";
import ConfirmDialog from "@/components/ConfirmDialog";
import { downloadJson } from "@/lib/dataExport";
import { formatRelativeTime } from "@/lib/utils";
import { useLocale } from "@/context/LocaleContext";

interface BackupManagerProps {
  backups: BackupSnapshot[];
  onBackupNow: (note?: string) => void;
  onRestore: (backupId: string) => void;
  onDelete: (backupId: string) => void;
  onDeleteAll: () => void;
  restoreContext: {
    backupId: string;
    appliedAt: string;
    expiresAt: string;
  } | null;
  onUndoRestore: () => void;
  onDismissUndo: () => void;
}

export default function BackupManager({
  backups,
  onBackupNow,
  onRestore,
  onDelete,
  onDeleteAll,
  restoreContext,
  onUndoRestore,
  onDismissUndo,
}: BackupManagerProps) {
  const [deleteTarget, setDeleteTarget] = useState<BackupSnapshot | null>(null);
  const [backupNote, setBackupNote] = useState("");
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const { locale } = useLocale();

  const formattedBackups = useMemo(
    () => {
      const now = new Date();
      return backups.map((backup) => {
        const created = new Date(backup.createdAt);
        return {
          backup,
          formattedDate: created.toLocaleString(locale, {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }),
          recordCount: backup.records.length,
          planCount: backup.plans.length,
          relative: formatRelativeTime(created, now, locale),
        };
      });
    },
    [backups, locale]
  );

  const handleDownload = (snapshot: BackupSnapshot) => {
    const filename = `study-backup-${new Date(snapshot.createdAt).toISOString()}.json`;
    downloadJson(JSON.stringify(snapshot, null, 2), filename);
  };

  const handleBackupNowClick = () => {
    onBackupNow(backupNote.trim() === "" ? undefined : backupNote.trim());
    setBackupNote("");
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Backups</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Save snapshots with timestamps and restore them when needed.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="flex-1">
              <label
                htmlFor="backup-note"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Backup note (optional)
              </label>
          <input
                id="backup-note"
            type="text"
            value={backupNote}
            onChange={(e) => setBackupNote(e.target.value)}
                placeholder="Optional note"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2 sm:items-end">
            <button
              onClick={handleBackupNowClick}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
            >
              Backup Now
            </button>
            <button
              onClick={() => setShowDeleteAllConfirm(true)}
              disabled={backups.length === 0}
              className="inline-flex items-center justify-center px-4 py-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete All
            </button>
          </div>
        </div>
      </div>

      {restoreContext && (
        <div
          className="border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          role="status"
          aria-live="polite"
        >
          <div>
            <p className="text-sm font-medium">
              Backup restored: {new Date(restoreContext.appliedAt).toLocaleString(locale)}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              You can undo to revert to the previous state or keep the restored data.
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-200 mt-1">
              Undo available {formatRelativeTime(new Date(restoreContext.expiresAt), new Date(), locale)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onUndoRestore}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-white dark:bg-blue-950 text-blue-700 dark:text-blue-200 border border-blue-400 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900"
            >
              Undo
            </button>
            <button
              onClick={onDismissUndo}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Keep Changes
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {formattedBackups.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No backups yet. Create your first snapshot with &quot;Backup Now&quot;.
          </p>
        ) : (
          formattedBackups.map(({ backup, formattedDate, recordCount, planCount, relative }) => (
            <div
              key={backup.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{formattedDate}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Records: {recordCount} · Plans: {planCount} · {relative}
                </p>
                {backup.note && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Note: {backup.note}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onRestore(backup.id)}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Restore
                </button>
                <button
                  onClick={() => handleDownload(backup)}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Download
                </button>
                <button
                  onClick={() => setDeleteTarget(backup)}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Backup"
          message="Are you sure you want to delete this backup snapshot? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {showDeleteAllConfirm && (
        <ConfirmDialog
          title="Delete All Backups"
          message="This will remove all backup snapshots. You will not be able to recover them."
          confirmText="Delete All"
          cancelText="Cancel"
          onConfirm={() => {
            onDeleteAll();
            setShowDeleteAllConfirm(false);
          }}
          onCancel={() => setShowDeleteAllConfirm(false)}
        />
      )}
    </div>
  );
}

