"use client";

import { useState } from "react";
import type { StudyRecord, PlanData } from "@/types";
import { useStudyData } from "@/hooks/useStudyData";
import { formatDate } from "@/lib/utils";
import CalendarGrid from "@/components/CalendarGrid";
import PlanInputForm from "@/components/PlanInputForm";
import RecordModal from "@/components/RecordModal";
import AchievementStats from "@/components/AchievementStats";

/**
 * Main page component - Study Hour Calendar application
 * Integrates all components with Google-style minimalist UI
 * Now uses API backend instead of localStorage
 */
export default function Home() {
  const {
    records,
    plans,
    loading,
    error,
    addRecord,
    addPlan,
  } = useStudyData();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    // Show both options - user can choose to plan or record
    setShowPlanForm(true);
  };

  const handlePlanSave = async (plan: PlanData) => {
    try {
      setSaving(true);
      await addPlan(plan);
      setShowPlanForm(false);
      setSelectedDate(null);
    } catch (err) {
      console.error("Failed to save plan:", err);
      alert("Failed to save plan. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handlePlanCancel = () => {
    setShowPlanForm(false);
    setSelectedDate(null);
  };

  const handleRecordClick = () => {
    if (!selectedDate) {
      setSelectedDate(formatDate(new Date()));
    }
    setShowPlanForm(false);
    setShowRecordModal(true);
  };

  const handleRecordSave = async (record: StudyRecord) => {
    try {
      setSaving(true);
      // The API automatically accumulates minutes for the same date
      await addRecord(record);
      setShowRecordModal(false);
      setSelectedDate(null);
    } catch (err) {
      console.error("Failed to save record:", err);
      alert("Failed to save record. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleRecordCancel = () => {
    setShowRecordModal(false);
    setSelectedDate(null);
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Show loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading your study data...</p>
          </div>
        </div>
      </main>
    );
  }

  // Show error state
  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
          <div className="text-center bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Data</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <p className="text-sm text-gray-600">
              Make sure the backend server is running on port 5000
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-normal text-gray-800">Study Hour Calendar</h1>
          <p className="text-gray-600">Track your learning progress visually</p>
        </header>

        {/* Navigation Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth("prev")}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg 
                         hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 
                         transition-colors duration-200"
              aria-label="Previous month"
            >
              ← Prev
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg 
                         hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 
                         transition-colors duration-200"
              aria-label="Go to today"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth("next")}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg 
                         hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 
                         transition-colors duration-200"
              aria-label="Next month"
            >
              Next →
            </button>
          </div>
          <button
            onClick={handleRecordClick}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg 
                       hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
                       transition-colors duration-200 font-medium shadow-sm"
            aria-label="Record study time"
          >
            + Record Study Time
          </button>
        </div>

        {/* Calendar Grid */}
        <CalendarGrid
          records={records}
          plans={plans}
          currentDate={currentDate}
          onDateClick={handleDateClick}
        />

        {/* Achievement Statistics */}
        <AchievementStats records={records} plans={plans} currentDate={currentDate} />

        {/* Plan Input Form Modal */}
        {showPlanForm && selectedDate && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
            <div onClick={(e) => e.stopPropagation()}>
              <PlanInputForm
                selectedDate={selectedDate}
                existingPlan={plans.find((p) => p.date === selectedDate)}
                onSave={handlePlanSave}
                onCancel={handlePlanCancel}
                disabled={saving}
              />
            </div>
          </div>
        )}

        {/* Record Modal */}
        {showRecordModal && selectedDate && (
          <RecordModal
            selectedDate={selectedDate}
            onSave={handleRecordSave}
            onCancel={handleRecordCancel}
            disabled={saving}
          />
        )}
      </div>
    </main>
  );
}

