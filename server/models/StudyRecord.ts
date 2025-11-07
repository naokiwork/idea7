/**
 * MongoDB model for StudyRecord
 */

import mongoose, { Schema, Document } from "mongoose";

export interface IStudyRecord extends Document {
  date: string; // Format: YYYY-MM-DD
  minutes: number; // Total minutes studied on this date
  createdAt: Date;
  updatedAt: Date;
}

const StudyRecordSchema = new Schema<IStudyRecord>(
  {
    date: {
      type: String,
      required: true,
      index: true, // Index for faster queries
      match: /^\d{4}-\d{2}-\d{2}$/, // Validate YYYY-MM-DD format
    },
    minutes: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Unique index for date - one record per date (minutes are accumulated in POST route)
StudyRecordSchema.index({ date: 1 }, { unique: true });

// Create model
const StudyRecord = mongoose.model<IStudyRecord>("StudyRecord", StudyRecordSchema);

export default StudyRecord;

