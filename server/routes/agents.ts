import { Router } from "express";
import { callClaude } from "../services/claude.js";
import { crmSystemPrompt } from "../prompts/crm.js";
import { creativeSystemPrompt } from "../prompts/creative.js";
import { designSystemPrompt } from "../prompts/design.js";

export const agentsRouter = Router();

const userPrompt = (enriched: unknown) =>
  `Enriched client data:\n\n${JSON.stringify(enriched, null, 2)}`;

const fail = (res: import("express").Response, label: string, error: unknown) => {
  console.error(`${label} error:`, error);
  res.status(500).json({
    error: `${label} failed`,
    message: error instanceof Error ? error.message : "Unknown error",
  });
};

agentsRouter.post("/crm", async (req, res) => {
  try {
    const crm = await callClaude({
      system: crmSystemPrompt,
      user: userPrompt(req.body),
    });
    res.json({ crm });
  } catch (error) {
    fail(res, "CRM agent", error);
  }
});

agentsRouter.post("/creative", async (req, res) => {
  try {
    const creative = await callClaude({
      system: creativeSystemPrompt,
      user: userPrompt(req.body),
      maxTokens: 8192,
    });
    res.json({ creative });
  } catch (error) {
    fail(res, "Creative agent", error);
  }
});

agentsRouter.post("/design", async (req, res) => {
  try {
    const design = await callClaude({
      system: designSystemPrompt,
      user: userPrompt(req.body),
    });
    res.json({ design });
  } catch (error) {
    fail(res, "Design agent", error);
  }
});

agentsRouter.post("/assets", async (_req, res) => {
  const assets = {
    logo: {
      filename: "demo-logo.svg",
      dimensions: "400x120",
      size: "24KB",
    },
    generated: [
      { filename: "favicon.ico", dimensions: "32x32", purpose: "Browser tab icon" },
      { filename: "og-image.png", dimensions: "1200x630", purpose: "Social sharing" },
      { filename: "hero-2560.webp", dimensions: "2560x1440", purpose: "Desktop hero" },
      { filename: "hero-1280.webp", dimensions: "1280x720", purpose: "Tablet hero" },
      { filename: "hero-640.webp", dimensions: "640x360", purpose: "Mobile hero" },
    ],
  };
  res.json({ assets });
});
