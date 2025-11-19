"use client";

import { useState, useRef } from "react";
import type { StudyRecord, PlanData } from "@/types";
import { exportToJSON, exportToCSV, downloadFile, importFromJSON, importFromCSV } from "@/lib/dataExport";
import ErrorMessage from "./ErrorMessage";
import ConfirmDialog from "./ConfirmDialog";

interface DataExportImportProps {
  records: StudyRecord[];
  plans: PlanData[];
  onImport: (records: StudyRecord[], plans: PlanData[]) => void;
}

/**
 * DataExportImport component - handles data export and import
 */
export default function DataExportImport({
  records,
  plans,
  onImport,
}: DataExportImportProps) {
  const [error, setError] = useState<string | null>(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [importData, setImportData] = useState<{ records: StudyRecord[]; plans: PlanData[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJSON = () => {
    try {
      const json = exportToJSON(records, plans);
      const filename = `study-calendar-export-${new Date().toISOString().split("T")[0]}.json`;
      downloadFile(json, filename, "application/json");
      setError(null);
    } catch (err) {
      setError("Failed to export data. Please try again.");
      console.error("Export error:", err);
    }
  };

  const handleExportCSV = () => {
    try {
      const csv = exportToCSV(records, plans);
      const filename = `study-calendar-export-${new Date().toISOString().split("T")[0]}.csv`;
      downloadFile(csv, filename, "text/csv");
      setError(null);
    } catch (err) {
      setError("Failed to export data. Please try again.");
      console.error("Export error:", err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        let data: { records: StudyRecord[]; plans: PlanData[]; error?: string };

        if (file.name.endsWith(".json")) {
          data = importFromJSON(content);
        } else if (file.name.endsWith(".csv")) {
          data = importFromCSV(content);
        } else {
          setError("Unsupported file format. Please use JSON or CSV.");
          return;
        }

        if (data.error) {
          setError(data.error);
          return;
        }

        setImportData(data);
        setShowImportConfirm(true);
        setError(null);
      } catch (err) {
        setError("Failed to read file. Please try again.");
        console.error("Import error:", err);
      }
    };

    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImportConfirm = () => {
    if (importData) {
      onImport(importData.records, importData.plans);
      setShowImportConfirm(false);
      setImportData(null);
      setError(null);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
        Data Export / Import
      </h3>

      {error && (
        <div className="mb-4">
          <ErrorMessage message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      <div className="space-y-4">
        {/* Export Section */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Export Data</h4>
          <div className="flex gap-3">
            <button
              onClick={handleExportJSON}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg 
                         hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
                         transition-colors duration-200 font-medium"
              aria-label="Export as JSON"
            >
              Export JSON
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg 
                         hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 
                         transition-colors duration-200 font-medium"
              aria-label="Export as CSV"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Import Data</h4>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv"
              onChange={handleFileSelect}
              className="hidden"
              id="import-file-input"
              aria-label="Import file"
            />
            <label
              htmlFor="import-file-input"
              className="inline-block px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg 
                         hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 
                         transition-colors duration-200 font-medium cursor-pointer"
            >
              Choose File
            </label>
            <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
              (JSON or CSV)
            </span>
          </div>
        </div>
      </div>

      {/* Import Confirm Dialog */}
      {showImportConfirm && importData && (
        <ConfirmDialog
          title="Import Data"
          message={`This will replace all existing data with ${importData.records.length} records and ${importData.plans.length} plans. Are you sure?`}
          confirmText="Import"
          cancelText="Cancel"
          onConfirm={handleImportConfirm}
          onCancel={() => {
            setShowImportConfirm(false);
            setImportData(null);
          }}
        />
      )}
    </div>
  );
}

