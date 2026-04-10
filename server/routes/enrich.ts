import { Router } from "express";
import { callClaude } from "../services/claude.js";
import { enrichSystemPrompt } from "../prompts/enrich.js";

export const enrichRouter = Router();

enrichRouter.post("/", async (req, res) => {
  try {
    const intake = req.body;
    const result = await callClaude({
      system: enrichSystemPrompt,
      user: `Here is the raw client intake data:\n\n${JSON.stringify(intake, null, 2)}`,
    });
    res.json(result);
  } catch (error) {
    console.error("Enrichment error:", error);
    res.status(500).json({
      error: "Enrichment failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
