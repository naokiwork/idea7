/**
 * Data export/import utilities
 */

import type { StudyRecord, PlanData } from "@/types";

/**
 * Export data to JSON format
 */
export function exportToJSON(records: StudyRecord[], plans: PlanData[]): string {
  const data = {
    records,
    plans,
    exportDate: new Date().toISOString(),
    version: "1.0",
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Export data to CSV format
 */
export function exportToCSV(records: StudyRecord[], plans: PlanData[]): string {
  const lines: string[] = [];

  // Records CSV
  lines.push("Type,Date,Hours,Minutes");
  records.forEach((record) => {
    const hours = Math.floor(record.minutes / 60);
    const minutes = record.minutes % 60;
    lines.push(`Record,${record.date},${hours},${minutes}`);
  });

  // Plans CSV
  plans.forEach((plan) => {
    lines.push(`Plan,${plan.date},${plan.hours},${plan.minutes}`);
  });

  return lines.join("\n");
}

/**
 * Download data as file
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download JSON data as file
 */
export function downloadJson(content: string, filename: string) {
  downloadFile(content, filename, "application/json");
}

/**
 * Import data from JSON
 */
export function importFromJSON(jsonString: string): {
  records: StudyRecord[];
  plans: PlanData[];
  error?: string;
} {
  try {
    const data = JSON.parse(jsonString);

    // Validate structure
    if (!data.records || !data.plans) {
      return {
        records: [],
        plans: [],
        error: "Invalid data format. Expected records and plans arrays.",
      };
    }

    // Validate records
    const records: StudyRecord[] = data.records.filter((r: any) => {
      return r && typeof r.date === "string" && typeof r.minutes === "number";
    });

    // Validate plans
    const plans: PlanData[] = data.plans.filter((p: any) => {
      return (
        p &&
        typeof p.date === "string" &&
        typeof p.hours === "number" &&
        typeof p.minutes === "number"
      );
    });

    return { records, plans };
  } catch (error) {
    return {
      records: [],
      plans: [],
      error: error instanceof Error ? error.message : "Failed to parse JSON",
    };
  }
}

/**
 * Import data from CSV
 */
export function importFromCSV(csvString: string): {
  records: StudyRecord[];
  plans: PlanData[];
  error?: string;
} {
  try {
    const lines = csvString.split("\n").filter((line) => line.trim());
    const records: StudyRecord[] = [];
    const plans: PlanData[] = [];

    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const [type, date, hoursStr, minutesStr] = lines[i].split(",");
      if (!type || !date) continue;

      const hours = parseInt(hoursStr) || 0;
      const minutes = parseInt(minutesStr) || 0;

      if (type.trim() === "Record") {
        records.push({
          date: date.trim(),
          minutes: hours * 60 + minutes,
        });
      } else if (type.trim() === "Plan") {
        plans.push({
          date: date.trim(),
          hours,
          minutes,
        });
      }
    }

    return { records, plans };
  } catch (error) {
    return {
      records: [],
      plans: [],
      error: error instanceof Error ? error.message : "Failed to parse CSV",
    };
  }
}

