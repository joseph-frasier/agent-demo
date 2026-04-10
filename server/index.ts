import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { enrichRouter } from "./routes/enrich.js";
import { agentsRouter } from "./routes/agents.js";
import { buildRouter } from "./routes/build.js";
import { projectRouter } from "./routes/project.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = 3001;

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json({ limit: "10mb" }));

// Serve generated site files statically
app.use("/generated", express.static(path.join(__dirname, "generated")));

// Mount routes
app.use("/enrich", enrichRouter);
app.use("/agents", agentsRouter);
app.use("/build", buildRouter);
app.use("/project", projectRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
