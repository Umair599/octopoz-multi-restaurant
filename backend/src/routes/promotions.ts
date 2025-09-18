import express from "express";
import db from "../db";
import { v4 as uuidv4 } from "uuid";
import { authMiddleware, AuthRequest } from "../auth/auth";

const router = express.Router();
router.use(authMiddleware);

// Get all promotions for a restaurant
router.get("/:restaurantId/promotions", async (req: AuthRequest, res) => {
  const { restaurantId } = req.params;
  
  if (req.user.role !== "super_admin" && req.user.restaurant_id !== restaurantId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  
  const promotions = await db("promotions")
    .where({ restaurant_id: restaurantId })
    .orderBy("created_at", "desc")
    .select("*");
    
  res.json(promotions.map(p => ({
    ...p,
    applicable_items: typeof p.applicable_items === 'string' ? JSON.parse(p.applicable_items || '[]') : p.applicable_items,
    conditions: typeof p.conditions === 'string' ? JSON.parse(p.conditions || '{}') : p.conditions,
  })));
});

// Create a new promotion
router.post("/:restaurantId/promotions", async (req: AuthRequest, res) => {
  const { restaurantId } = req.params;
  const {
    name,
    description,
    type,
    discount_value,
    applicable_items,
    start_date,
    end_date,
    usage_limit,
    conditions
  } = req.body;
  
  if (req.user.role !== "super_admin" && req.user.restaurant_id !== restaurantId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  
  const id = uuidv4();
  await db("promotions").insert({
    id,
    restaurant_id: restaurantId,
    name,
    description,
    type,
    discount_value,
    applicable_items: JSON.stringify(applicable_items || []),
    start_date,
    end_date,
    usage_limit,
    conditions: JSON.stringify(conditions || {}),
  });
  
  res.status(201).json({ id, name });
});

// Update promotion
router.patch("/:restaurantId/promotions/:promotionId", async (req: AuthRequest, res) => {
  const { restaurantId, promotionId } = req.params;
  
  if (req.user.role !== "super_admin" && req.user.restaurant_id !== restaurantId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  
  const updateData = req.body;
  if (updateData.applicable_items) {
    updateData.applicable_items = JSON.stringify(updateData.applicable_items);
  }
  if (updateData.conditions) {
    updateData.conditions = JSON.stringify(updateData.conditions);
  }
  
  await db("promotions")
    .where({ id: promotionId, restaurant_id: restaurantId })
    .update(updateData);
    
  res.json({ ok: true });
});

// Delete promotion
router.delete("/:restaurantId/promotions/:promotionId", async (req: AuthRequest, res) => {
  const { restaurantId, promotionId } = req.params;
  
  if (req.user.role !== "super_admin" && req.user.restaurant_id !== restaurantId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  
  await db("promotions")
    .where({ id: promotionId, restaurant_id: restaurantId })
    .delete();
    
  res.json({ ok: true });
});

// Get active promotions for public use (customers)
router.get("/:restaurantId/active-promotions", async (req, res) => {
  const { restaurantId } = req.params;
  const currentDate = new Date().toISOString();
  
  const promotions = await db("promotions")
    .where({ restaurant_id: restaurantId, active: true })
    .where("start_date", "<=", currentDate)
    .where("end_date", ">=", currentDate)
    .whereRaw("(usage_limit IS NULL OR used_count < usage_limit)")
    .select("*");
    
  res.json(promotions.map(p => ({
    ...p,
    applicable_items: typeof p.applicable_items === 'string' ? JSON.parse(p.applicable_items || '[]') : p.applicable_items,
    conditions: typeof p.conditions === 'string' ? JSON.parse(p.conditions || '{}') : p.conditions,
  })));
});

export default router;
