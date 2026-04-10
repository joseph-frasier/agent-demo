import { Router } from "express";
export const enrichRouter = Router();
enrichRouter.post("/", (_req, res) => {
  res.json({ placeholder: true });
});
