import express from "express";
import db from "../db";
import { v4 as uuidv4 } from "uuid";
import { authMiddleware, AuthRequest } from "../auth/auth";

const router = express.Router({ mergeParams: true });
router.use(authMiddleware);

// create menu item (restaurant_admin)
router.post("/:restaurantId/menu-items", async (req: AuthRequest, res) => {
  const { restaurantId } = req.params;
  const { name, description, price_cents, currency, images } = req.body;
  // if the user is not super_admin, ensure restaurant matches
  if (
    req.user.role !== "super_admin" &&
    req.user.restaurant_id !== restaurantId
  )
    return res.status(403).json({ error: "Forbidden" });
  const id = uuidv4();
  await db("menu_items").insert({
    id,
    restaurant_id: restaurantId,
    name,
    description,
    price_cents,
    currency: currency || "USD",
    images: JSON.stringify(images || []),
  });
  res.status(201).json({ id, name });
});

router.get("/:restaurantId/menu-items", async (req, res) => {
  const { restaurantId } = req.params;
  const items = await db("menu_items")
    .where({ restaurant_id: restaurantId })
    .select("*");
  res.json(
    items.map((i) => ({
      ...i,
      images:
        typeof i.images === "string" ? JSON.parse(i.images || "[]") : i.images,
    }))
  );
});

router.patch(
  "/:restaurantId/menu-items/:itemId",
  async (req: AuthRequest, res) => {
    const { restaurantId, itemId } = req.params;
    if (
      req.user.role !== "super_admin" &&
      req.user.restaurant_id !== restaurantId
    )
      return res.status(403).json({ error: "Forbidden" });
    const patch = req.body;
    if (patch.images) patch.images = JSON.stringify(patch.images);
    await db("menu_items")
      .where({ id: itemId, restaurant_id: restaurantId })
      .update(patch);
    res.json({ ok: true });
  }
);

router.delete(
  "/:restaurantId/menu-items/:itemId",
  async (req: AuthRequest, res) => {
    const { restaurantId, itemId } = req.params;
    if (
      req.user.role !== "super_admin" &&
      req.user.restaurant_id !== restaurantId
    )
      return res.status(403).json({ error: "Forbidden" });
    await db("menu_items")
      .where({ id: itemId, restaurant_id: restaurantId })
      .delete();
    res.json({ ok: true });
  }
);

export default router;
