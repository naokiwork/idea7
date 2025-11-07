/**
 * API routes for Study Records
 */

import express, { Request, Response } from "express";
import StudyRecord from "../models/StudyRecord";

const router = express.Router();

/**
 * GET /api/records
 * Get all study records, optionally filtered by date range
 * Query params: from (YYYY-MM-DD), to (YYYY-MM-DD)
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;

    let query: any = {};

    if (from && to) {
      query.date = { $gte: from as string, $lte: to as string };
    } else if (from) {
      query.date = { $gte: from as string };
    } else if (to) {
      query.date = { $lte: to as string };
    }

    const records = await StudyRecord.find(query).sort({ date: 1 });
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/records/:date
 * Get study record for a specific date
 */
router.get("/:date", async (req: Request, res: Response) => {
  try {
    const { date } = req.params;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }

    const record = await StudyRecord.findOne({ date });

    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.json(record);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/records
 * Create a new study record or add minutes to existing record
 * Body: { date: string, minutes: number }
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { date, minutes } = req.body;

    if (!date || minutes === undefined) {
      return res.status(400).json({ error: "date and minutes are required" });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }

    if (typeof minutes !== "number" || minutes < 0) {
      return res.status(400).json({ error: "minutes must be a non-negative number" });
    }

    // Check if record exists for this date
    const existingRecord = await StudyRecord.findOne({ date });

    if (existingRecord) {
      // Add to existing minutes (accumulate)
      existingRecord.minutes += minutes;
      await existingRecord.save();
      res.json(existingRecord);
    } else {
      // Create new record
      const record = new StudyRecord({ date, minutes });
      await record.save();
      res.status(201).json(record);
    }
  } catch (error: any) {
    if (error.code === 11000) {
      // Duplicate key error
      res.status(409).json({ error: "Record already exists for this date" });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * PUT /api/records/:date
 * Update study record for a specific date
 * Body: { minutes: number }
 */
router.put("/:date", async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const { minutes } = req.body;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }

    if (minutes === undefined || typeof minutes !== "number" || minutes < 0) {
      return res.status(400).json({ error: "minutes must be a non-negative number" });
    }

    const record = await StudyRecord.findOneAndUpdate(
      { date },
      { minutes },
      { new: true, runValidators: true }
    );

    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.json(record);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/records/:date
 * Delete study record for a specific date
 */
router.delete("/:date", async (req: Request, res: Response) => {
  try {
    const { date } = req.params;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }

    const record = await StudyRecord.findOneAndDelete({ date });

    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.json({ message: "Record deleted successfully", record });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/records
 * Delete all study records (use with caution)
 */
router.delete("/", async (req: Request, res: Response) => {
  try {
    const result = await StudyRecord.deleteMany({});
    res.json({ message: `Deleted ${result.deletedCount} records` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

