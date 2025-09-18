import express from "express";
import db from "../db";
import { v4 as uuidv4 } from "uuid";
import { authMiddleware, AuthRequest } from "../auth/auth";

const router = express.Router();

// Public route to make a reservation (no auth required)
router.post("/:restaurantId/reservations", async (req, res) => {
  const { restaurantId } = req.params;
  const {
    customer_name,
    customer_email,
    customer_phone,
    party_size,
    reservation_date,
    reservation_time,
    special_requests
  } = req.body;
  
  // Check if restaurant is active
  const restaurant = await db("restaurants")
    .where({ id: restaurantId, status: "active" })
    .first();
    
  if (!restaurant) {
    return res.status(404).json({ error: "Restaurant not found or inactive" });
  }
  
  // Find available table
  const availableTables = await db("tables")
    .where({ restaurant_id: restaurantId, status: "available" })
    .where("capacity", ">=", party_size)
    .orderBy("capacity", "asc")
    .select("*");
    
  if (availableTables.length === 0) {
    return res.status(400).json({ error: "No available tables for the requested party size" });
  }
  
  const table = availableTables[0];
  const reservationId = uuidv4();
  
  await db("reservations").insert({
    id: reservationId,
    restaurant_id: restaurantId,
    table_id: table.id,
    customer_name,
    customer_email,
    customer_phone,
    party_size,
    reservation_date,
    reservation_time,
    special_requests,
  });
  
  res.status(201).json({ 
    id: reservationId, 
    table_number: table.table_number,
    message: "Reservation confirmed" 
  });
});

// Public route to get available time slots
router.get("/:restaurantId/available-slots", async (req, res) => {
  const { restaurantId } = req.params;
  const { date, party_size } = req.query;
  
  // Check if restaurant is active
  const restaurant = await db("restaurants")
    .where({ id: restaurantId, status: "active" })
    .first();
    
  if (!restaurant) {
    return res.status(404).json({ error: "Restaurant not found or inactive" });
  }
  
  // Get available tables for party size
  const availableTables = await db("tables")
    .where({ restaurant_id: restaurantId, status: "available" })
    .where("capacity", ">=", party_size)
    .select("*");
    
  // Get existing reservations for the date
  const existingReservations = await db("reservations")
    .where({ restaurant_id: restaurantId, reservation_date: date })
    .where("status", "!=", "cancelled")
    .select("*");
  
  // Generate available time slots (simplified logic)
  const timeSlots = [];
  for (let hour = 11; hour <= 21; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      // Check if any table is available at this time
      const conflictingReservations = existingReservations.filter(r => {
        const reservationTime = new Date(`${date} ${r.reservation_time}`);
        const currentTime = new Date(`${date} ${timeString}`);
        const timeDiff = Math.abs(reservationTime.getTime() - currentTime.getTime()) / (1000 * 60);
        return timeDiff < 120; // 2 hour buffer
      });
      
      if (conflictingReservations.length < availableTables.length) {
        timeSlots.push(timeString);
      }
    }
  }
  
  res.json({ available_slots: timeSlots });
});

router.use(authMiddleware);

// Get reservations for a restaurant
router.get("/:restaurantId/reservations", async (req: AuthRequest, res) => {
  const { restaurantId } = req.params;
  const { date, status } = req.query;
  
  if (req.user.role !== "super_admin" && req.user.restaurant_id !== restaurantId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  
  let query = db("reservations")
    .leftJoin("tables", "reservations.table_id", "tables.id")
    .where("reservations.restaurant_id", restaurantId)
    .select(
      "reservations.*",
      "tables.table_number"
    );
    
  if (date) {
    query = query.where("reservation_date", date);
  }
  
  if (status) {
    query = query.where("reservations.status", status);
  }
  
  const reservations = await query.orderBy("reservation_date", "desc");
  res.json(reservations);
});

// Update reservation status
router.patch("/:restaurantId/reservations/:reservationId", async (req: AuthRequest, res) => {
  const { restaurantId, reservationId } = req.params;
  const { status } = req.body;
  
  if (req.user.role !== "super_admin" && req.user.restaurant_id !== restaurantId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  
  await db("reservations")
    .where({ id: reservationId, restaurant_id: restaurantId })
    .update({ status });
    
  res.json({ ok: true });
});

export default router;
