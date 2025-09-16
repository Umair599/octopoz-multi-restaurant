import express from "express";
import db from "../db";
import { v4 as uuidv4 } from "uuid";
import { authMiddleware, AuthRequest } from "../auth/auth";

const router = express.Router({ mergeParams: true });
router.use(authMiddleware);

router.post("/:restaurantId/orders", async (req: AuthRequest, res) => {
  const { restaurantId } = req.params;
  const { items, total_cents } = req.body;
  // ensure tenant
  if (
    req.user.role !== "super_admin" &&
    req.user.restaurant_id !== restaurantId
  )
    return res.status(403).json({ error: "Forbidden" });

  const rest = await db("restaurants").where({ id: restaurantId }).first();
  if (!rest) return res.status(404).json({ error: "No restaurant" });

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  await db.transaction(async (trx) => {
    let counter = await trx("order_counters")
      .where({ restaurant_id: restaurantId, year, month })
      .first();
    const count = counter ? counter.orders_count : 0;
    if (count >= rest.monthly_capacity) {
      return res.status(429).json({ error: "Monthly capacity reached" });
    }

    const id = uuidv4();
    await trx("orders").insert({
      id,
      restaurant_id: restaurantId,
      items: JSON.stringify(items),
      total_cents,
      status: "new",
    });

    if (counter) {
      await trx("order_counters")
        .where({ id: counter.id })
        .update({ orders_count: counter.orders_count + 1 });
    } else {
      await trx("order_counters").insert({
        id: uuidv4(),
        restaurant_id: restaurantId,
        year,
        month,
        orders_count: 1,
      });
    }
    res.status(201).json({ id });
  });
});

router.get("/:restaurantId/orders", async (req: AuthRequest, res) => {
  const { restaurantId } = req.params;
  if (
    req.user.role !== "super_admin" &&
    req.user.restaurant_id !== restaurantId
  )
    return res.status(403).json({ error: "Forbidden" });
  const items = await db("orders")
    .where({ restaurant_id: restaurantId })
    .select("*");
  res.json(
    items.map((i) => ({
      ...i,
      items: typeof i.items === "string" ? JSON.parse(i.items) : i.items,
    }))
  );
});

export default router;
