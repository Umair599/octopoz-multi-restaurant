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

// Get restaurant by subdomain (public route)
router.get("/by-subdomain/:subdomain", async (req, res) => {
  const { subdomain } = req.params;
  
  const restaurant = await db("restaurants")
    .where({ subdomain, status: "active" })
    .first();
    
  if (!restaurant) {
    return res.status(404).json({ error: "Restaurant not found" });
  }
  
  // Parse JSON fields
  restaurant.operating_hours = typeof restaurant.operating_hours === 'string' 
    ? JSON.parse(restaurant.operating_hours || '{}') 
    : restaurant.operating_hours;
  restaurant.gst_settings = typeof restaurant.gst_settings === 'string' 
    ? JSON.parse(restaurant.gst_settings || '{}') 
    : restaurant.gst_settings;
  
  res.json(restaurant);
});

// Get menu for subdomain (public route)
router.get("/by-subdomain/:subdomain/menu", async (req, res) => {
  const { subdomain } = req.params;
  
  const restaurant = await db("restaurants")
    .where({ subdomain, status: "active" })
    .first();
    
  if (!restaurant) {
    return res.status(404).json({ error: "Restaurant not found" });
  }
  
  // Get categories
  const categories = await db("menu_categories")
    .where({ restaurant_id: restaurant.id, available: true })
    .orderBy("sort_order");
  
  // Get menu items
  const items = await db("menu_items")
    .where({ restaurant_id: restaurant.id, available: true })
    .orderBy("sort_order");
  
  // Parse images field for menu items
  const parsedItems = items.map(item => ({
    ...item,
    images: typeof item.images === 'string' ? JSON.parse(item.images || '[]') : (item.images || []),
    allergens: typeof item.allergens === 'string' ? JSON.parse(item.allergens || '[]') : (item.allergens || []),
    dietary_info: typeof item.dietary_info === 'string' ? JSON.parse(item.dietary_info || '[]') : (item.dietary_info || [])
  }));
  
  res.json({
    restaurant,
    categories,
    items: parsedItems
  });
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
  
  // Generate subdomain from restaurant name
  const subdomain = name.toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove special characters
    .replace(/\s+/g, '') // Remove spaces
    .substring(0, 20); // Limit length
  
  // Check if subdomain already exists
  const existingSubdomain = await db("restaurants").where({ subdomain }).first();
  if (existingSubdomain) {
    return res.status(400).json({ error: "Restaurant name already exists (subdomain conflict)" });
  }
  
  // Generate admin credentials
  const adminEmail = `admin@${subdomain}.octopoz.com`;
  const adminPassword = Math.random().toString(36).slice(-12); // Generate random password
  const adminId = uuidv4();
  
  try {
    // Create restaurant
    await db("restaurants").insert({
      id,
      name,
      subdomain,
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
    
    // Create admin user
    const { hash } = require("../utils");
    const hashedPassword = await hash(adminPassword);
    
    await db("users").insert({
      id: adminId,
      email: adminEmail,
      password_hash: hashedPassword,
      role: "restaurant_admin",
      restaurant_id: id,
      first_name: "Admin",
      last_name: name
    });
    
    res.status(201).json({ 
      id, 
      name, 
      subdomain: `${subdomain}.octopoz.com`,
      admin_credentials: {
        email: adminEmail,
        password: adminPassword
      },
      monthly_capacity 
    });
  } catch (error) {
    // Rollback if user creation fails
    await db("restaurants").where({ id }).del();
    throw error;
  }
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

// Update restaurant logo
router.patch("/:id/logo", async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { logo_url } = req.body;
  
  // Check if user has access to this restaurant
  if (req.user.role !== "super_admin" && req.user.restaurant_id !== id) {
    return res.status(403).json({ error: "Forbidden" });
  }
  
  await db("restaurants").where({ id }).update({ logo_url });
  res.json({ ok: true, message: "Logo updated successfully" });
});

// Update restaurant profile (restaurant admin can update their own)
router.patch("/:id/profile", async (req: AuthRequest, res) => {
  const { id } = req.params;
  
  // Check if user has access to this restaurant
  if (req.user.role !== "super_admin" && req.user.restaurant_id !== id) {
    return res.status(403).json({ error: "Forbidden" });
  }
  
  const updateData = req.body;
  
  if (updateData.operating_hours) {
    updateData.operating_hours = JSON.stringify(updateData.operating_hours);
  }
  
  if (updateData.gst_settings) {
    updateData.gst_settings = JSON.stringify(updateData.gst_settings);
  }
  
  await db("restaurants").where({ id }).update(updateData);
  res.json({ ok: true, message: "Profile updated successfully" });
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
