import express from "express";
import db from "../db";
import { v4 as uuidv4 } from "uuid";
import { authMiddleware, AuthRequest, ensureRole } from "../auth/auth";
import QRCode from "qrcode";

const router = express.Router();

// Public route to get active restaurants (no auth required)
router.get("/public", async (req, res) => {
  const { cuisine, location, search } = req.query;
  let query = db("restaurants").where({ status: "active" }).select("*");
  
  if (cuisine) {
    query = query.where("cuisine_type", "like", `%${cuisine}%`);
  }
  
  if (search) {
    query = query.where("name", "like", `%${search}%`);
  }
  
  const restaurants = await query;
  res.json(restaurants);
});

router.use(authMiddleware);

// create restaurant (super only)
router.post("/", ensureRole("super_admin"), async (req: AuthRequest, res) => {
  const { 
    name, 
    monthly_capacity, 
    cuisine_type, 
    address, 
    phone, 
    email, 
    description,
    latitude,
    longitude,
    logo_url,
    operating_hours,
    gst_settings
  } = req.body;
  
  const id = uuidv4();
  await db("restaurants").insert({
    id,
    name,
    monthly_capacity: monthly_capacity || 1000,
    cuisine_type,
    address,
    phone,
    email,
    description,
    latitude,
    longitude,
    logo_url,
    operating_hours: JSON.stringify(operating_hours || {}),
    gst_settings: JSON.stringify(gst_settings || {}),
  });
  
  res.status(201).json({ id, name, monthly_capacity });
});

router.get("/", ensureRole("super_admin"), async (req, res) => {
  const list = await db("restaurants").select("*");
  res.json(list.map(r => ({
    ...r,
    operating_hours: typeof r.operating_hours === 'string' ? JSON.parse(r.operating_hours || '{}') : r.operating_hours,
    gst_settings: typeof r.gst_settings === 'string' ? JSON.parse(r.gst_settings || '{}') : r.gst_settings,
  })));
});

router.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  if (req.user.role === "super_admin")
    return res
      .status(403)
      .json({ error: "Super admin has no single restaurant" });
  const r = await db("restaurants")
    .where({ id: req.user.restaurant_id })
    .first();
  
  if (r) {
    r.operating_hours = typeof r.operating_hours === 'string' ? JSON.parse(r.operating_hours || '{}') : r.operating_hours;
    r.gst_settings = typeof r.gst_settings === 'string' ? JSON.parse(r.gst_settings || '{}') : r.gst_settings;
  }
  
  res.json(r);
});

router.patch("/:id/status", ensureRole("super_admin"), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  await db("restaurants").where({ id }).update({ status });
  res.json({ ok: true });
});

router.patch("/:id", ensureRole("super_admin"), async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  if (updateData.operating_hours) {
    updateData.operating_hours = JSON.stringify(updateData.operating_hours);
  }
  
  if (updateData.gst_settings) {
    updateData.gst_settings = JSON.stringify(updateData.gst_settings);
  }
  
  await db("restaurants").where({ id }).update(updateData);
  res.json({ ok: true });
});

// Get restaurant tables
router.get("/:id/tables", async (req: AuthRequest, res) => {
  const { id } = req.params;
  
  // Check if user has access to this restaurant
  if (req.user.role !== "super_admin" && req.user.restaurant_id !== id) {
    return res.status(403).json({ error: "Forbidden" });
  }
  
  const tables = await db("tables").where({ restaurant_id: id }).select("*");
  res.json(tables);
});

// Create table
router.post("/:id/tables", async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { table_number, capacity } = req.body;
  
  if (req.user.role !== "super_admin" && req.user.restaurant_id !== id) {
    return res.status(403).json({ error: "Forbidden" });
  }
  
  const tableId = uuidv4();
  
  // Generate QR code for table
  const qrCodeData = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/restaurant/${id}/table/${tableId}/menu`;
  const qrCode = await QRCode.toDataURL(qrCodeData);
  
  await db("tables").insert({
    id: tableId,
    restaurant_id: id,
    table_number,
    capacity,
    qr_code: qrCode,
  });
  
  res.status(201).json({ id: tableId, table_number, capacity, qr_code: qrCode });
});

export default router;
