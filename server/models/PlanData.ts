/**
 * MongoDB model for PlanData
 */

import mongoose, { Schema, Document } from "mongoose";

export interface IPlanData extends Document {
  date: string; // Format: YYYY-MM-DD
  hours: number;
  minutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const PlanDataSchema = new Schema<IPlanData>(
  {
    date: {
      type: String,
      required: true,
      index: true, // Index for faster queries
      match: /^\d{4}-\d{2}-\d{2}$/, // Validate YYYY-MM-DD format
    },
    hours: {
      type: Number,
      required: true,
      min: 0,
      max: 24,
    },
    minutes: {
      type: Number,
      required: true,
      min: 0,
      max: 59,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Compound index for date uniqueness (one plan per date)
PlanDataSchema.index({ date: 1 }, { unique: true });

// Create model
const PlanData = mongoose.model<IPlanData>("PlanData", PlanDataSchema);

export default PlanData;

