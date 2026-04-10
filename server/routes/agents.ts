import { Router } from "express";
import { callClaude } from "../services/claude.js";
import { crmSystemPrompt } from "../prompts/crm.js";
import { creativeSystemPrompt } from "../prompts/creative.js";
import { designSystemPrompt } from "../prompts/design.js";

export const agentsRouter = Router();

agentsRouter.post("/", async (req, res) => {
  try {
    const enriched = req.body;
    const enrichedStr = JSON.stringify(enriched, null, 2);

    // Run CRM, Creative, and Design agents in parallel
    const [crm, creative, design] = await Promise.all([
      callClaude({
        system: crmSystemPrompt,
        user: `Enriched client data:\n\n${enrichedStr}`,
      }),
      callClaude({
        system: creativeSystemPrompt,
        user: `Enriched client data:\n\n${enrichedStr}`,
        maxTokens: 8192,
      }),
      callClaude({
        system: designSystemPrompt,
        user: `Enriched client data:\n\n${enrichedStr}`,
      }),
    ]);

    // Asset agent is mocked — no Claude call
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

    res.json({ crm, creative, design, assets });
  } catch (error) {
    console.error("Agents error:", error);
    res.status(500).json({
      error: "Agent processing failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
