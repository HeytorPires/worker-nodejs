import { Router } from "express";

export const calcRoutes = Router();

calcRoutes.get("/", (req, res) => {
  const endTime = Date.now() + 60_000;

  while (Date.now() < endTime) {
    Math.sqrt(Math.random() * 1_000_000);
  }

  res.json({ 200: "ok" });
});
