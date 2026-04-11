import { Router } from "express";
import { callClaudeText } from "../services/claude.js";
import { fetchUnsplashImages, type UnsplashImage } from "../services/unsplash.js";
import { buildSystemPrompt } from "../prompts/build.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type Page = { name: string; filename: string; html: string };

function buildFaviconSvg(initial: string, bgColor: string): string {
  const safeInitial = (initial || "?").slice(0, 1).toUpperCase();
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" rx="12" fill="${bgColor}"/>
  <text x="32" y="44" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="38" font-weight="800" text-anchor="middle" fill="#FFFFFF">${safeInitial}</text>
</svg>
`;
}

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

    // Fetch topical stock photos from Unsplash before building. Falls back
    // to empty list on any failure — build should never die because of it.
    let images: UnsplashImage[] = [];
    try {
      const query = enriched?.client?.industry || "business";
      images = await fetchUnsplashImages(query, 10);
      console.log(`Fetched ${images.length} Unsplash images for "${query}"`);
    } catch (err) {
      console.warn(
        `Unsplash fetch failed, continuing without images: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }

    const prompt = buildSystemPrompt({
      logoUrl: "/generated/demo-logo.svg",
      heroImageUrl: "/generated/demo-hero.jpg",
    });

    const imagesSection =
      images.length > 0
        ? `\n\nAVAILABLE IMAGES (use these exact URLs in the HTML — do NOT invent image URLs, do NOT use source.unsplash.com):
${images
  .map(
    (img, i) =>
      `${i + 1}. ${img.url}\n   alt: ${img.altDescription || "stock photo"}\n   credit: ${img.photographerName} on Unsplash (${img.photographerUrl})`
  )
  .join("\n")}

Attribution requirement: the HTML footer on every page must include a small credit line listing the photographers used, linking to their Unsplash profile URLs.`
        : `\n\n(No stock images available — use only the provided hero URL.)`;

    const rawText = await callClaudeText({
      system: prompt,
      user: `Generate the website using this data:

ENRICHED CLIENT DATA:
${JSON.stringify(enriched, null, 2)}

CREATIVE BRIEF:
${JSON.stringify(creative, null, 2)}

DESIGN TOKENS:
${JSON.stringify(design, null, 2)}${imagesSection}`,
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

    // Generate a per-session favicon from the primary brand color + business initial
    const businessName = enriched?.client?.businessName ?? "?";
    const primaryColor = enriched?.brand?.colors?.primary?.hex ?? "#0B1E3F";
    const favicon = buildFaviconSvg(businessName.trim().charAt(0), primaryColor);
    await fs.writeFile(path.join(sessionDir, "favicon.svg"), favicon);

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
