/**
 * API client utilities for Study Hour Calendar
 */

import type { StudyRecord, PlanData } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error(`API Error (${endpoint}):`, error);
    // Provide more helpful error messages
    if (error.message?.includes("Failed to fetch") || error.message?.includes("NetworkError") || error.name === "TypeError") {
      throw new Error(`Failed to fetch\nMake sure the backend server is running on port 5000`);
    }
    throw error;
  }
}

/**
 * Study Records API
 */
export const recordsAPI = {
  /**
   * Get all records, optionally filtered by date range
   */
  getAll: async (from?: string, to?: string): Promise<StudyRecord[]> => {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    
    const query = params.toString();
    return fetchAPI<StudyRecord[]>(`/records${query ? `?${query}` : ""}`);
  },

  /**
   * Get record for a specific date
   */
  getByDate: async (date: string): Promise<StudyRecord | null> => {
    try {
      return await fetchAPI<StudyRecord>(`/records/${date}`);
    } catch (error: any) {
      if (error.message.includes("404") || error.message.includes("not found")) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Create or add to existing record
   */
  create: async (record: StudyRecord): Promise<StudyRecord> => {
    return fetchAPI<StudyRecord>("/records", {
      method: "POST",
      body: JSON.stringify(record),
    });
  },

  /**
   * Update record for a specific date
   */
  update: async (date: string, minutes: number): Promise<StudyRecord> => {
    return fetchAPI<StudyRecord>(`/records/${date}`, {
      method: "PUT",
      body: JSON.stringify({ minutes }),
    });
  },

  /**
   * Delete record for a specific date
   */
  delete: async (date: string): Promise<void> => {
    await fetchAPI(`/records/${date}`, {
      method: "DELETE",
    });
  },
};

/**
 * Study Plans API
 */
export const plansAPI = {
  /**
   * Get all plans, optionally filtered by date range
   */
  getAll: async (from?: string, to?: string): Promise<PlanData[]> => {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    
    const query = params.toString();
    return fetchAPI<PlanData[]>(`/plans${query ? `?${query}` : ""}`);
  },

  /**
   * Get plan for a specific date
   */
  getByDate: async (date: string): Promise<PlanData | null> => {
    try {
      return await fetchAPI<PlanData>(`/plans/${date}`);
    } catch (error: any) {
      if (error.message.includes("404") || error.message.includes("not found")) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Create or update plan
   */
  create: async (plan: PlanData): Promise<PlanData> => {
    return fetchAPI<PlanData>("/plans", {
      method: "POST",
      body: JSON.stringify(plan),
    });
  },

  /**
   * Update plan for a specific date
   */
  update: async (date: string, hours: number, minutes: number): Promise<PlanData> => {
    return fetchAPI<PlanData>(`/plans/${date}`, {
      method: "PUT",
      body: JSON.stringify({ hours, minutes }),
    });
  },

  /**
   * Delete plan for a specific date
   */
  delete: async (date: string): Promise<void> => {
    await fetchAPI(`/plans/${date}`, {
      method: "DELETE",
    });
  },
};

