import { Router } from "express";
import { callClaude } from "../services/claude.js";
import { buildSystemPrompt } from "../prompts/build.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const buildRouter = Router();

buildRouter.post("/", async (req, res) => {
  try {
    const { enriched, creative, design } = req.body;
    const sessionId = crypto.randomUUID().slice(0, 8);

    const prompt = buildSystemPrompt({
      logoUrl: "/generated/demo-logo.svg",
      heroImageUrl: "/generated/demo-hero.jpg",
    });

    const result = await callClaude<{
      pages: Array<{ name: string; filename: string; html: string }>;
    }>({
      system: prompt,
      user: `Generate the website using this data:

ENRICHED CLIENT DATA:
${JSON.stringify(enriched, null, 2)}

CREATIVE BRIEF:
${JSON.stringify(creative, null, 2)}

DESIGN TOKENS:
${JSON.stringify(design, null, 2)}`,
      maxTokens: 16384,
    });

    // Write generated HTML files to disk
    const sessionDir = path.join(__dirname, "..", "generated", sessionId);
    await fs.mkdir(sessionDir, { recursive: true });

    // Copy demo assets into the session directory
    const publicDir = path.join(__dirname, "..", "..", "client", "public");
    try {
      await fs.copyFile(
        path.join(publicDir, "demo-logo.svg"),
        path.join(sessionDir, "demo-logo.svg")
      );
      await fs.copyFile(
        path.join(publicDir, "demo-hero.jpg"),
        path.join(sessionDir, "demo-hero.jpg")
      );
    } catch {
      // Assets may not exist yet — non-fatal
    }

    for (const page of result.pages) {
      // Fix asset paths to be relative
      const fixedHtml = page.html
        .replace(/\/generated\/demo-logo\.svg/g, "demo-logo.svg")
        .replace(/\/generated\/demo-hero\.jpg/g, "demo-hero.jpg");
      await fs.writeFile(path.join(sessionDir, page.filename), fixedHtml);
    }

    res.json({
      sessionId,
      pages: result.pages.map((p) => ({
        name: p.name,
        filename: p.filename,
      })),
      metadata: {
        framework: "Static HTML + Tailwind CSS CDN",
        styling: "Tailwind CSS",
        pageCount: result.pages.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Build error:", error);
    res.status(500).json({
      error: "Website build failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
