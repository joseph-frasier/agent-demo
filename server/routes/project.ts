import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";

export const projectRouter = Router();

const client = new Anthropic();

projectRouter.post("/", async (req, res) => {
  try {
    const { enriched, creative, mode } = req.body;

    const projectPayload = {
      name: `${enriched.client.businessName} — Website Build`,
      description: `Web design project for ${enriched.client.businessName}. ${enriched.brand.tagline}`,
      knowledgeDocs: [
        {
          name: "Client Intake Data",
          content: JSON.stringify(enriched, null, 2),
        },
        {
          name: "Creative Brief",
          content: JSON.stringify(creative, null, 2),
        },
        {
          name: "Brand Guidelines",
          content: `Brand: ${enriched.client.businessName}\nTagline: ${enriched.brand.tagline}\nTone: ${enriched.brand.tone.join(", ")}\nVoice: ${enriched.brand.voiceGuidelines}\nPrimary Color: ${enriched.brand.colors.primary.hex} (${enriched.brand.colors.primary.name})\nSecondary Color: ${enriched.brand.colors.secondary.hex} (${enriched.brand.colors.secondary.name})`,
        },
      ],
    };

    if (mode === "live") {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const beta = client.beta as any;
        const project = await beta.projects.create({
          name: projectPayload.name,
          description: projectPayload.description,
        });

        for (const doc of projectPayload.knowledgeDocs) {
          await beta.projects.docs.create(project.id, {
            name: doc.name,
            content: doc.content,
          });
        }

        res.json({
          projectId: project.id,
          name: project.name,
          docsCount: projectPayload.knowledgeDocs.length,
          mode: "live",
        });
      } catch (apiError) {
        console.error("Projects API error, falling back to display:", apiError);
        res.json({
          projectId: `proj_${Date.now().toString(36)}`,
          name: projectPayload.name,
          docsCount: projectPayload.knowledgeDocs.length,
          mode: "display",
          fallbackReason: "Projects API unavailable",
        });
      }
    } else {
      res.json({
        projectId: `proj_${Date.now().toString(36)}`,
        name: projectPayload.name,
        docsCount: projectPayload.knowledgeDocs.length,
        mode: "display",
      });
    }
  } catch (error) {
    console.error("Project error:", error);
    res.status(500).json({
      error: "Project creation failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
