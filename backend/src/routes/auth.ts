import { Router } from "express";
import db from "../db";
import { v4 as uuidv4 } from "uuid";
import { hash, compare } from "../utils";
import { sign } from "../auth/jwt";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await db("users").where({ email }).first();
  if (!user) return res.status(401).json({ error: "Invalid creds" });
  const ok = await compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid creds" });
  const token = sign({
    id: user.id,
    role: user.role,
    restaurant_id: user.restaurant_id,
  });
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      restaurant_id: user.restaurant_id,
    },
  });
});

// super admin can create user
router.post("/signup", async (req, res) => {
  const { email, password, role, restaurant_id } = req.body;
  const existing = await db("users").where({ email }).first();
  if (existing) return res.status(400).json({ error: "Email exists" });
  const id = uuidv4();
  const pass = await hash(password);
  await db("users").insert({
    id,
    email,
    password_hash: pass,
    role,
    restaurant_id,
  });
  res.status(201).json({ id, email, role, restaurant_id });
});

export default router;
