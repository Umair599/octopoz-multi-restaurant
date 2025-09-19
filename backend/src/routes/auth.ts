import { Router } from "express";
import db from "../db";
import { v4 as uuidv4 } from "uuid";
import { hash, compare } from "../utils";
import { sign } from "../auth/jwt";
import { authMiddleware, ensureRole } from "../auth/auth";

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

// Subdomain-specific login
router.post("/login/:subdomain", async (req, res) => {
  const { email, password } = req.body;
  const { subdomain } = req.params;
  
  // Get restaurant by subdomain
  const restaurant = await db("restaurants").where({ subdomain }).first();
  if (!restaurant) {
    return res.status(404).json({ error: "Restaurant not found" });
  }
  
  // Find user for this restaurant
  const user = await db("users")
    .where({ email, restaurant_id: restaurant.id })
    .first();
    
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  
  const ok = await compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  
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
      first_name: user.first_name,
      last_name: user.last_name
    },
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      subdomain: restaurant.subdomain
    }
  });
});

// super admin can create user
router.post("/signup", async (req, res) => {
  const { email, password, role, restaurant_id, first_name, last_name } = req.body;
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
    first_name,
    last_name,
  });
  res.status(201).json({ id, email, role, restaurant_id, first_name, last_name });
});

// Get all users (super admin only)
router.get("/users", authMiddleware, ensureRole("super_admin"), async (req, res) => {
  const users = await db("users")
    .select("id", "email", "role", "restaurant_id", "first_name", "last_name", "created_at")
    .orderBy("created_at", "desc");
  res.json(users);
});

// Create user by super admin
router.post("/users", authMiddleware, ensureRole("super_admin"), async (req, res) => {
  const { email, password, role, restaurant_id, first_name, last_name } = req.body;
  const existing = await db("users").where({ email }).first();
  if (existing) return res.status(400).json({ error: "Email already exists" });
  
  const id = uuidv4();
  const pass = await hash(password);
  await db("users").insert({
    id,
    email,
    password_hash: pass,
    role,
    restaurant_id,
    first_name,
    last_name,
  });
  
  res.status(201).json({ 
    id, 
    email, 
    role, 
    restaurant_id, 
    first_name, 
    last_name,
    message: "User created successfully"
  });
});

// Update user (super admin only)
router.patch("/users/:id", authMiddleware, ensureRole("super_admin"), async (req, res) => {
  const { id } = req.params;
  const { email, role, restaurant_id, first_name, last_name } = req.body;
  
  const existing = await db("users").where({ email }).whereNot({ id }).first();
  if (existing) return res.status(400).json({ error: "Email already exists" });
  
  await db("users").where({ id }).update({
    email,
    role,
    restaurant_id,
    first_name,
    last_name,
    updated_at: new Date()
  });
  
  res.json({ message: "User updated successfully" });
});

// Delete user (super admin only)
router.delete("/users/:id", authMiddleware, ensureRole("super_admin"), async (req, res) => {
  const { id } = req.params;
  await db("users").where({ id }).del();
  res.json({ message: "User deleted successfully" });
});

export default router;
