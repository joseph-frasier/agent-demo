import { Router } from "express";
import { callClaudeText } from "../services/claude.js";
import { buildSystemPrompt } from "../prompts/build.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type Page = { name: string; filename: string; html: string };

function parsePageBlocks(text: string): Page[] {
  const pages: Page[] = [];
  const blockRegex = /<<<PAGE>>>([\s\S]*?)<<<ENDPAGE>>>/g;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(text)) !== null) {
    const block = match[1];
    const nameMatch = block.match(/^\s*NAME:\s*(.+?)\s*$/m);
    const filenameMatch = block.match(/^\s*FILENAME:\s*(.+?)\s*$/m);
    const htmlMarkerIdx = block.search(/^\s*HTML:\s*$/m);

    if (!nameMatch || !filenameMatch || htmlMarkerIdx === -1) continue;

    // HTML body starts on the line after "HTML:"
    const afterMarker = block.slice(htmlMarkerIdx);
    const htmlStart = afterMarker.indexOf("\n");
    if (htmlStart === -1) continue;
    const html = afterMarker.slice(htmlStart + 1).trim();

    pages.push({
      name: nameMatch[1].trim(),
      filename: filenameMatch[1].trim(),
      html,
    });
  }

  return pages;
}

export const buildRouter = Router();

buildRouter.post("/", async (req, res) => {
  try {
    const { enriched, creative, design } = req.body;
    const sessionId = crypto.randomUUID().slice(0, 8);

    const prompt = buildSystemPrompt({
      logoUrl: "/generated/demo-logo.svg",
      heroImageUrl: "/generated/demo-hero.jpg",
    });

    const rawText = await callClaudeText({
      system: prompt,
      user: `Generate the website using this data:

ENRICHED CLIENT DATA:
${JSON.stringify(enriched, null, 2)}

CREATIVE BRIEF:
${JSON.stringify(creative, null, 2)}

DESIGN TOKENS:
${JSON.stringify(design, null, 2)}`,
      maxTokens: 32768,
    });

    const pages = parsePageBlocks(rawText);
    if (pages.length === 0) {
      const preview = rawText.slice(0, 300).replace(/\n/g, "\\n");
      throw new Error(
        `No <<<PAGE>>> blocks found in build response. Preview: ${preview}...`
      );
    }

    const result = { pages };

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
