import { Router, type Response } from "express";
import { streamClaudeText } from "../services/claude.js";
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

// ── SSE helpers ───────────────────────────────────────────────────────────────

function sseSend(res: Response, event: string, data: object) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// Walks the accumulated stream buffer for newly-closed <<<PAGE>>>...<<<ENDPAGE>>>
// blocks. Returns the names of all pages that have closed so far so the caller
// can diff against what it's already announced.
function findClosedPageNames(buffer: string): string[] {
  const names: string[] = [];
  const blockRegex = /<<<PAGE>>>([\s\S]*?)<<<ENDPAGE>>>/g;
  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(buffer)) !== null) {
    const nameMatch = match[1].match(/^\s*NAME:\s*(.+?)\s*$/m);
    if (nameMatch) names.push(nameMatch[1].trim());
  }
  return names;
}

export const buildRouter = Router();

buildRouter.post("/", async (req, res) => {
  // Set up Server-Sent Events response
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  try {
    const { enriched, creative, design } = req.body;
    const sessionId = crypto.randomUUID().slice(0, 8);

    sseSend(res, "status", { message: "Fetching reference images..." });

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

    sseSend(res, "status", { message: "Generating website..." });

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

    // Stream the build response, watching for <<<ENDPAGE>>> markers as they
    // arrive so we can announce per-page progress to the client in real time.
    const announcedPageNames = new Set<string>();
    let pageIndex = 0;

    const designStyle = req.body.designStyle ?? "standard";
    const designStyleSection =
      designStyle === "bold"
        ? `\n\nDESIGN STYLE: BOLD & EXPRESSIVE — GO ALL IN
Push HARD on visual drama for this site. This is NOT a safe, conservative build. Treat this like a high-budget startup launch page.

GRADIENTS ARE MANDATORY in bold mode — use them generously:
- Hero: dramatic gradient mesh or multi-stop gradient as the primary background, not just a photo with overlay. Think radial gradients in brand colors, layered with noise or grain.
- Section transitions: use full-bleed gradient dividers or gradient-to-solid fades between sections instead of plain color changes.
- CTA buttons: gradient backgrounds with a subtle shimmer or hover shift.
- Card backgrounds: glass-morphism with backdrop-blur and gradient tinted borders.
- At least 3-4 distinct gradient moments across the whole site — hero, a mid-page feature section, a testimonial/social-proof band, and the CTA footer.

ALSO MANDATORY in bold mode:
- Dark hero sections with neon-ish accent glows (box-shadow or text-shadow in brand accent color)
- Dramatic type scale: clamp(3.5rem, 8vw, 7rem) for hero headlines, with varied weights (100 or 900, not just 400/700)
- Asymmetric layouts with intentional overlap — elements that break out of their grid cells
- Staggered scroll-reveal animations with CSS @keyframes + animation-delay
- At least 2 surprising hover states (underline sweep, color wash, scale + subtle rotate, gradient shift)
- Editorial layout devices: oversized section numbers (01, 02, 03), pull quotes at display scale, diagonal or skewed accent elements
- Glassmorphism or frosted-glass panels where appropriate (backdrop-blur + bg-white/5 + subtle border)
- Make this look like a funded startup's marketing site that won a design award, not a template

Still follow the contrast and legibility rules — bold doesn't mean unreadable. Gradient backgrounds with text on top MUST have enough contrast (dark gradient base → white text, or light gradient base → dark text).`
        : `\n\nDESIGN STYLE: CLEAN & PROFESSIONAL
Build a polished, appropriate site. Follow the brand treatment matrix closely.
Add personality per the checklist, but keep the overall feel grounded and trustworthy.`;

    const rawText = await streamClaudeText({
      system: prompt,
      user: `Generate the website using this data:

ENRICHED CLIENT DATA:
${JSON.stringify(enriched, null, 2)}

CREATIVE BRIEF:
${JSON.stringify(creative, null, 2)}

DESIGN TOKENS:
${JSON.stringify(design, null, 2)}${imagesSection}${designStyleSection}`,
      maxTokens: 64000,
      onChunk: (_delta, accumulated) => {
        const closed = findClosedPageNames(accumulated);
        for (const name of closed) {
          if (!announcedPageNames.has(name)) {
            announcedPageNames.add(name);
            sseSend(res, "page_complete", {
              name,
              index: pageIndex++,
            });
          }
        }
      },
    });

    const pages = parsePageBlocks(rawText);
    if (pages.length === 0) {
      const preview = rawText.slice(0, 300).replace(/\n/g, "\\n");
      throw new Error(
        `No <<<PAGE>>> blocks found in build response. Preview: ${preview}...`
      );
    }

    // Write generated HTML files to disk
    const sessionDir = path.join(__dirname, "..", "generated", sessionId);
    await fs.mkdir(sessionDir, { recursive: true });

    const publicDir = path.join(__dirname, "..", "..", "client", "public");
    try {
      const logoRelPath = req.body.logoUrl
        ? req.body.logoUrl.replace(/^\//, "")
        : "demo-logo.svg";
      await fs.copyFile(
        path.join(publicDir, logoRelPath),
        path.join(sessionDir, "demo-logo.svg")
      );
      await fs.copyFile(
        path.join(publicDir, "demo-hero.jpg"),
        path.join(sessionDir, "demo-hero.jpg")
      );
    } catch {
      // Assets may not exist yet — non-fatal
    }

    const businessName = enriched?.client?.businessName ?? "?";
    const primaryColor = enriched?.brand?.colors?.primary?.hex ?? "#0B1E3F";
    const favicon = buildFaviconSvg(businessName.trim().charAt(0), primaryColor);
    await fs.writeFile(path.join(sessionDir, "favicon.svg"), favicon);

    for (const page of pages) {
      const fixedHtml = page.html
        .replace(/\/generated\/demo-logo\.svg/g, "demo-logo.svg")
        .replace(/\/generated\/demo-hero\.jpg/g, "demo-hero.jpg");
      await fs.writeFile(path.join(sessionDir, page.filename), fixedHtml);
    }

    sseSend(res, "complete", {
      sessionId,
      pages: pages.map((p) => ({
        name: p.name,
        filename: p.filename,
      })),
      metadata: {
        framework: "Static HTML + Tailwind CSS CDN",
        styling: "Tailwind CSS",
        pageCount: pages.length,
        generatedAt: new Date().toISOString(),
      },
    });
    res.end();
  } catch (error) {
    console.error("Build error:", error);
    sseSend(res, "error", {
      error: "Website build failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
    res.end();
  }
});
