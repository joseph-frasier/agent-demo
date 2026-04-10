import { Router } from "express";
export const agentsRouter = Router();
agentsRouter.post("/", (_req, res) => {
  res.json({ placeholder: true });
});
