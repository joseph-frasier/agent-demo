import { Router } from "express";
export const projectRouter = Router();
projectRouter.post("/", (_req, res) => {
  res.json({ placeholder: true });
});
