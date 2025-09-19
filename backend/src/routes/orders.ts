import express from "express";
import db from "../db";
import { v4 as uuidv4 } from "uuid";
import { authMiddleware, AuthRequest } from "../auth/auth";
import moment from "moment";

const router = express.Router({ mergeParams: true });

// Public route to create order (no auth required for customers)
router.post("/:restaurantId/orders", async (req, res) => {
  const { restaurantId } = req.params;
  const {
    items,
    customer_name,
    customer_email,
    customer_phone,
    order_type,
    subtotal_cents,
    tax_cents,
    discount_cents,
    total_cents,
    payment_method,
    payment_id,
    special_instructions,
    delivery_address,
    table_id,
    promotion_id
  } = req.body;
  
  // Check if restaurant is active
  const restaurant = await db("restaurants")
    .where({ id: restaurantId, status: "active" })
    .first();
    
  if (!restaurant) {
    return res.status(404).json({ error: "Restaurant not found or inactive" });
  }
  
  // Generate order number
  const today = moment().format('YYYY-MM-DD');
  const counter = await db("order_counters")
    .where({ restaurant_id: restaurantId, date: today })
    .first();
    
  let orderNumber;
  if (counter) {
    await db("order_counters")
      .where({ id: counter.id })
      .increment('counter', 1);
    orderNumber = `${moment().format('YYYYMMDD')}-${(counter.counter + 1).toString().padStart(3, '0')}`;
  } else {
    await db("order_counters").insert({
      id: uuidv4(),
      restaurant_id: restaurantId,
      date: today,
      counter: 1
    });
    orderNumber = `${moment().format('YYYYMMDD')}-001`;
  }
  
  const orderId = uuidv4();
  await db("orders").insert({
    id: orderId,
    restaurant_id: restaurantId,
    order_number: orderNumber,
    customer_name,
    customer_email,
    customer_phone,
    order_type,
    items: JSON.stringify(items),
    subtotal_cents,
    tax_cents: tax_cents || 0,
    discount_cents: discount_cents || 0,
    total_cents,
    payment_method,
    payment_id,
    special_instructions,
    delivery_address: delivery_address ? JSON.stringify(delivery_address) : null,
    table_id,
    promotion_id,
    estimated_delivery_time: order_type === 'delivery' ? 
      moment().add(45, 'minutes').toISOString() : 
      moment().add(20, 'minutes').toISOString()
  });
  
  // Update promotion usage if applicable
  if (promotion_id) {
    await db("promotions")
      .where({ id: promotion_id })
      .increment('used_count', 1);
  }
  
  res.status(201).json({ 
    id: orderId, 
    order_number: orderNumber,
    estimated_delivery_time: order_type === 'delivery' ? 
      moment().add(45, 'minutes').toISOString() : 
      moment().add(20, 'minutes').toISOString()
  });
});

// Public route to get order status (no auth required)
router.get("/:restaurantId/orders/:orderId/status", async (req, res) => {
  const { restaurantId, orderId } = req.params;
  
  const order = await db("orders")
    .where({ id: orderId, restaurant_id: restaurantId })
    .select("id", "order_number", "status", "estimated_delivery_time", "created_at")
    .first();
    
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  
  res.json(order);
});

router.use(authMiddleware);

// Get orders for restaurant staff
router.get("/:restaurantId/orders", async (req: AuthRequest, res) => {
  const { restaurantId } = req.params;
  const { status, date, limit } = req.query;
  
  if (req.user.role !== "super_admin" && req.user.restaurant_id !== restaurantId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  
  let query = db("orders")
    .where({ restaurant_id: restaurantId })
    .orderBy("created_at", "desc");
    
  if (status) {
    query = query.where("status", status);
  }
  
  if (date) {
    const startDate = moment(date as string).startOf('day').toISOString();
    const endDate = moment(date as string).endOf('day').toISOString();
    query = query.whereBetween("created_at", [startDate, endDate]);
  }
  
  if (limit) {
    query = query.limit(parseInt(limit as string));
  }
  
  const orders = await query.select("*");
  
  res.json(
    orders.map((o) => ({
      ...o,
      items: typeof o.items === "string" ? JSON.parse(o.items || "[]") : o.items,
      delivery_address: o.delivery_address ? 
        (typeof o.delivery_address === "string" ? JSON.parse(o.delivery_address) : o.delivery_address) : null,
    }))
  );
});

// Update order status
router.patch("/:restaurantId/orders/:orderId", async (req: AuthRequest, res) => {
  const { restaurantId, orderId } = req.params;
  const { status, assigned_staff, estimated_delivery_time } = req.body;
  
  if (req.user.role !== "super_admin" && req.user.restaurant_id !== restaurantId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  
  const updateData: any = {};
  if (status) updateData.status = status;
  if (assigned_staff) updateData.assigned_staff = assigned_staff;
  if (estimated_delivery_time) updateData.estimated_delivery_time = estimated_delivery_time;
  
  await db("orders")
    .where({ id: orderId, restaurant_id: restaurantId })
    .update(updateData);
    
  res.json({ ok: true });
});

// Get order details
router.get("/:restaurantId/orders/:orderId", async (req: AuthRequest, res) => {
  const { restaurantId, orderId } = req.params;
  
  if (req.user.role !== "super_admin" && req.user.restaurant_id !== restaurantId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  
  const order = await db("orders")
    .leftJoin("tables", "orders.table_id", "tables.id")
    .leftJoin("promotions", "orders.promotion_id", "promotions.id")
    .where("orders.id", orderId)
    .where("orders.restaurant_id", restaurantId)
    .select(
      "orders.*",
      "tables.table_number",
      "promotions.name as promotion_name"
    )
    .first();
    
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  
  order.items = typeof order.items === "string" ? JSON.parse(order.items || "[]") : order.items;
  order.delivery_address = order.delivery_address ? 
    (typeof order.delivery_address === "string" ? JSON.parse(order.delivery_address) : order.delivery_address) : null;
  
  res.json(order);
});

export default router;
