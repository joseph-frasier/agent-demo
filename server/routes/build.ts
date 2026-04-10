import { Router } from "express";
export const buildRouter = Router();
buildRouter.post("/", (_req, res) => {
  res.json({ placeholder: true });
});
