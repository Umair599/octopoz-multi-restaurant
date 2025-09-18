import express from "express";
import db from "../db";
import { v4 as uuidv4 } from "uuid";
import { authMiddleware, AuthRequest } from "../auth/auth";

const router = express.Router({ mergeParams: true });

// Public route to get menu (no auth required for customers)
router.get("/:restaurantId/menu", async (req, res) => {
  const { restaurantId } = req.params;
  
  // Get restaurant info
  const restaurant = await db("restaurants")
    .where({ id: restaurantId, status: "active" })
    .first();
    
  if (!restaurant) {
    return res.status(404).json({ error: "Restaurant not found or inactive" });
  }
  
  // Get categories
  const categories = await db("menu_categories")
    .where({ restaurant_id: restaurantId, available: true })
    .orderBy("sort_order", "asc")
    .select("*");
  
  // Get menu items
  const items = await db("menu_items")
    .where({ restaurant_id: restaurantId, available: true })
    .orderBy("sort_order", "asc")
    .select("*");
  
  const menuData = {
    restaurant,
    categories,
    items: items.map((i) => ({
      ...i,
      images: typeof i.images === "string" ? JSON.parse(i.images || "[]") : i.images,
      allergens: typeof i.allergens === "string" ? JSON.parse(i.allergens || "[]") : i.allergens,
      dietary_info: typeof i.dietary_info === "string" ? JSON.parse(i.dietary_info || "[]") : i.dietary_info,
    }))
  };
  
  res.json(menuData);
});

router.use(authMiddleware);

// Menu Categories Management
router.get("/:restaurantId/categories", async (req: AuthRequest, res) => {
  const { restaurantId } = req.params;
  
  if (req.user.role !== "super_admin" && req.user.restaurant_id !== restaurantId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  
  const categories = await db("menu_categories")
    .where({ restaurant_id: restaurantId })
    .orderBy("sort_order", "asc")
    .select("*");
    
  res.json(categories);
});

router.post("/:restaurantId/categories", async (req: AuthRequest, res) => {
  const { restaurantId } = req.params;
  const { name, description, sort_order } = req.body;
  
  if (req.user.role !== "super_admin" && req.user.restaurant_id !== restaurantId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  
  const id = uuidv4();
  await db("menu_categories").insert({
    id,
    restaurant_id: restaurantId,
    name,
    description,
    sort_order: sort_order || 0,
  });
  
  res.status(201).json({ id, name });
});

router.patch("/:restaurantId/categories/:categoryId", async (req: AuthRequest, res) => {
  const { restaurantId, categoryId } = req.params;
  
  if (req.user.role !== "super_admin" && req.user.restaurant_id !== restaurantId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  
  await db("menu_categories")
    .where({ id: categoryId, restaurant_id: restaurantId })
    .update(req.body);
    
  res.json({ ok: true });
});

router.delete("/:restaurantId/categories/:categoryId", async (req: AuthRequest, res) => {
  const { restaurantId, categoryId } = req.params;
  
  if (req.user.role !== "super_admin" && req.user.restaurant_id !== restaurantId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  
  await db("menu_categories")
    .where({ id: categoryId, restaurant_id: restaurantId })
    .delete();
    
  res.json({ ok: true });
});

// Menu Items Management
router.post("/:restaurantId/menu-items", async (req: AuthRequest, res) => {
  const { restaurantId } = req.params;
  const { 
    name, 
    description, 
    price_cents, 
    currency, 
    images, 
    category_id,
    allergens,
    dietary_info,
    prep_time_minutes,
    gst_rate,
    sort_order
  } = req.body;
  
  if (req.user.role !== "super_admin" && req.user.restaurant_id !== restaurantId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  
  const id = uuidv4();
  await db("menu_items").insert({
    id,
    restaurant_id: restaurantId,
    category_id,
    name,
    description,
    price_cents,
    currency: currency || "USD",
    images: JSON.stringify(images || []),
    allergens: JSON.stringify(allergens || []),
    dietary_info: JSON.stringify(dietary_info || []),
    prep_time_minutes,
    gst_rate: gst_rate || 0,
    sort_order: sort_order || 0,
  });
  
  res.status(201).json({ id, name });
});

router.get("/:restaurantId/menu-items", async (req: AuthRequest, res) => {
  const { restaurantId } = req.params;
  
  if (req.user.role !== "super_admin" && req.user.restaurant_id !== restaurantId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  
  const items = await db("menu_items")
    .where({ restaurant_id: restaurantId })
    .orderBy("sort_order", "asc")
    .select("*");
    
  res.json(
    items.map((i) => ({
      ...i,
      images: typeof i.images === "string" ? JSON.parse(i.images || "[]") : i.images,
      allergens: typeof i.allergens === "string" ? JSON.parse(i.allergens || "[]") : i.allergens,
      dietary_info: typeof i.dietary_info === "string" ? JSON.parse(i.dietary_info || "[]") : i.dietary_info,
    }))
  );
});

router.patch("/:restaurantId/menu-items/:itemId", async (req: AuthRequest, res) => {
  const { restaurantId, itemId } = req.params;
  
  if (req.user.role !== "super_admin" && req.user.restaurant_id !== restaurantId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  
  const patch = req.body;
  if (patch.images) patch.images = JSON.stringify(patch.images);
  if (patch.allergens) patch.allergens = JSON.stringify(patch.allergens);
  if (patch.dietary_info) patch.dietary_info = JSON.stringify(patch.dietary_info);
  
  await db("menu_items")
    .where({ id: itemId, restaurant_id: restaurantId })
    .update(patch);
    
  res.json({ ok: true });
});

router.delete("/:restaurantId/menu-items/:itemId", async (req: AuthRequest, res) => {
  const { restaurantId, itemId } = req.params;
  
  if (req.user.role !== "super_admin" && req.user.restaurant_id !== restaurantId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  
  await db("menu_items")
    .where({ id: itemId, restaurant_id: restaurantId })
    .delete();
    
  res.json({ ok: true });
});

// Toggle item availability
router.patch("/:restaurantId/menu-items/:itemId/availability", async (req: AuthRequest, res) => {
  const { restaurantId, itemId } = req.params;
  const { available, sold_out } = req.body;
  
  if (req.user.role !== "super_admin" && req.user.restaurant_id !== restaurantId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  
  await db("menu_items")
    .where({ id: itemId, restaurant_id: restaurantId })
    .update({ available, sold_out });
    
  res.json({ ok: true });
});

export default router;
