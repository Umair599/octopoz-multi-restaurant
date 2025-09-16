import express from "express";
import db from "../db";
import { v4 as uuidv4 } from "uuid";
import { authMiddleware, AuthRequest, ensureRole } from "../auth/auth";

const router = express.Router();

router.use(authMiddleware);

// create restaurant (super only)
router.post("/", ensureRole("super_admin"), async (req: AuthRequest, res) => {
  const { name, monthly_capacity } = req.body;
  const id = uuidv4();
  await db("restaurants").insert({
    id,
    name,
    monthly_capacity: monthly_capacity || 1000,
  });
  res.status(201).json({ id, name, monthly_capacity });
});

router.get("/", ensureRole("super_admin"), async (req, res) => {
  const list = await db("restaurants").select("*");
  res.json(list);
});

router.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  if (req.user.role === "super_admin")
    return res
      .status(403)
      .json({ error: "Super admin has no single restaurant" });
  const r = await db("restaurants")
    .where({ id: req.user.restaurant_id })
    .first();
  res.json(r);
});

router.patch("/:id/status", ensureRole("super_admin"), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  await db("restaurants").where({ id }).update({ status });
  res.json({ ok: true });
});

export default router;
