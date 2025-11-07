/**
 * API routes for Study Plans
 */

import express, { Request, Response } from "express";
import PlanData from "../models/PlanData";

const router = express.Router();

/**
 * GET /api/plans
 * Get all study plans, optionally filtered by date range
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

    const plans = await PlanData.find(query).sort({ date: 1 });
    res.json(plans);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/plans/:date
 * Get study plan for a specific date
 */
router.get("/:date", async (req: Request, res: Response) => {
  try {
    const { date } = req.params;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }

    const plan = await PlanData.findOne({ date });

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    res.json(plan);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/plans
 * Create or update a study plan
 * Body: { date: string, hours: number, minutes: number }
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { date, hours, minutes } = req.body;

    if (!date || hours === undefined || minutes === undefined) {
      return res.status(400).json({ error: "date, hours, and minutes are required" });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }

    if (typeof hours !== "number" || hours < 0 || hours > 24) {
      return res.status(400).json({ error: "hours must be a number between 0 and 24" });
    }

    if (typeof minutes !== "number" || minutes < 0 || minutes > 59) {
      return res.status(400).json({ error: "minutes must be a number between 0 and 59" });
    }

    // Use upsert to create or update
    const plan = await PlanData.findOneAndUpdate(
      { date },
      { date, hours, minutes },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json(plan);
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({ error: "Plan already exists for this date" });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * PUT /api/plans/:date
 * Update study plan for a specific date
 * Body: { hours: number, minutes: number }
 */
router.put("/:date", async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const { hours, minutes } = req.body;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }

    if (hours === undefined || typeof hours !== "number" || hours < 0 || hours > 24) {
      return res.status(400).json({ error: "hours must be a number between 0 and 24" });
    }

    if (minutes === undefined || typeof minutes !== "number" || minutes < 0 || minutes > 59) {
      return res.status(400).json({ error: "minutes must be a number between 0 and 59" });
    }

    const plan = await PlanData.findOneAndUpdate(
      { date },
      { hours, minutes },
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    res.json(plan);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/plans/:date
 * Delete study plan for a specific date
 */
router.delete("/:date", async (req: Request, res: Response) => {
  try {
    const { date } = req.params;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }

    const plan = await PlanData.findOneAndDelete({ date });

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    res.json({ message: "Plan deleted successfully", plan });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/plans
 * Delete all study plans (use with caution)
 */
router.delete("/", async (req: Request, res: Response) => {
  try {
    const result = await PlanData.deleteMany({});
    res.json({ message: `Deleted ${result.deletedCount} plans` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

