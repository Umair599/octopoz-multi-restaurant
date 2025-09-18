import db from "../db";

async function up() {
  // restaurants
  const has = await db.schema.hasTable("restaurants");
  if (!has) {
    await db.schema.createTable("restaurants", (t) => {
      t.uuid("id").primary();
      t.string("name").notNullable();
      t.string("subdomain");
      t.string("logo_url");
      t.string("cuisine_type");
      t.string("address");
      t.string("phone");
      t.string("email");
      t.text("description");
      t.decimal("latitude", 10, 8);
      t.decimal("longitude", 11, 8);
      t.integer("monthly_capacity").defaultTo(1000);
      t.string("status").defaultTo("active");
      t.json("settings");
      t.json("gst_settings"); // GST configuration per restaurant
      t.json("operating_hours");
      t.timestamps(true, true);
    });
  }

  const hasUsers = await db.schema.hasTable("users");
  if (!hasUsers) {
    await db.schema.createTable("users", (t) => {
      t.uuid("id").primary();
      t.string("email").notNullable().unique();
      t.string("password_hash").notNullable();
      t.string("role").notNullable(); // super_admin, restaurant_admin, restaurant_staff
      t.uuid("restaurant_id");
      t.string("first_name");
      t.string("last_name");
      t.timestamps(true, true);
    });
  }

  // Menu categories
  const hasCategories = await db.schema.hasTable("menu_categories");
  if (!hasCategories) {
    await db.schema.createTable("menu_categories", (t) => {
      t.uuid("id").primary();
      t.uuid("restaurant_id").notNullable();
      t.string("name").notNullable();
      t.text("description");
      t.integer("sort_order").defaultTo(0);
      t.boolean("available").defaultTo(true);
      t.timestamps(true, true);
    });
  }

  const hasMenu = await db.schema.hasTable("menu_items");
  if (!hasMenu) {
    await db.schema.createTable("menu_items", (t) => {
      t.uuid("id").primary();
      t.uuid("restaurant_id").notNullable();
      t.uuid("category_id");
      t.string("name").notNullable();
      t.text("description");
      t.integer("price_cents").notNullable();
      t.string("currency").defaultTo("USD");
      t.json("images");
      t.boolean("available").defaultTo(true);
      t.boolean("sold_out").defaultTo(false);
      t.json("allergens");
      t.json("dietary_info"); // vegan, vegetarian, gluten-free, etc.
      t.integer("prep_time_minutes");
      t.decimal("gst_rate", 5, 2).defaultTo(0);
      t.integer("sort_order").defaultTo(0);
      t.timestamps(true, true);
    });
  }

  // Promotions
  const hasPromotions = await db.schema.hasTable("promotions");
  if (!hasPromotions) {
    await db.schema.createTable("promotions", (t) => {
      t.uuid("id").primary();
      t.uuid("restaurant_id").notNullable();
      t.string("name").notNullable();
      t.text("description");
      t.string("type").notNullable(); // percentage, fixed_amount, combo_deal
      t.decimal("discount_value", 10, 2);
      t.json("applicable_items"); // array of menu item IDs
      t.datetime("start_date");
      t.datetime("end_date");
      t.integer("usage_limit");
      t.integer("used_count").defaultTo(0);
      t.boolean("active").defaultTo(true);
      t.json("conditions"); // minimum order amount, etc.
      t.timestamps(true, true);
    });
  }

  const hasOrders = await db.schema.hasTable("orders");
  if (!hasOrders) {
    await db.schema.createTable("orders", (t) => {
      t.uuid("id").primary();
      t.uuid("restaurant_id").notNullable();
      t.string("order_number").notNullable();
      t.string("customer_name");
      t.string("customer_email");
      t.string("customer_phone");
      t.string("order_type").notNullable(); // delivery, pickup, dine_in
      t.json("items").notNullable();
      t.integer("subtotal_cents").notNullable();
      t.integer("tax_cents").defaultTo(0);
      t.integer("discount_cents").defaultTo(0);
      t.integer("total_cents").notNullable();
      t.string("status").defaultTo("new"); // new, confirmed, preparing, ready, delivered, cancelled
      t.string("payment_status").defaultTo("pending"); // pending, paid, failed, refunded
      t.string("payment_method");
      t.string("payment_id");
      t.uuid("table_id"); // for dine-in orders
      t.uuid("promotion_id");
      t.text("special_instructions");
      t.json("delivery_address");
      t.datetime("estimated_delivery_time");
      t.uuid("assigned_staff");
      t.timestamps(true, true);
    });
  }

  // Tables for reservations
  const hasTables = await db.schema.hasTable("tables");
  if (!hasTables) {
    await db.schema.createTable("tables", (t) => {
      t.uuid("id").primary();
      t.uuid("restaurant_id").notNullable();
      t.string("table_number").notNullable();
      t.integer("capacity").notNullable();
      t.string("status").defaultTo("available"); // available, occupied, reserved, out_of_service
      t.string("qr_code");
      t.timestamps(true, true);
    });
  }

  // Table reservations
  const hasReservations = await db.schema.hasTable("reservations");
  if (!hasReservations) {
    await db.schema.createTable("reservations", (t) => {
      t.uuid("id").primary();
      t.uuid("restaurant_id").notNullable();
      t.uuid("table_id");
      t.string("customer_name").notNullable();
      t.string("customer_email").notNullable();
      t.string("customer_phone");
      t.integer("party_size").notNullable();
      t.datetime("reservation_date").notNullable();
      t.datetime("reservation_time").notNullable();
      t.string("status").defaultTo("confirmed"); // confirmed, cancelled, completed, no_show
      t.text("special_requests");
      t.timestamps(true, true);
    });
  }

  // Sales reports cache
  const hasReports = await db.schema.hasTable("sales_reports");
  if (!hasReports) {
    await db.schema.createTable("sales_reports", (t) => {
      t.uuid("id").primary();
      t.uuid("restaurant_id").notNullable();
      t.string("report_type").notNullable(); // daily, weekly, monthly
      t.date("report_date").notNullable();
      t.json("data").notNullable();
      t.timestamps(true, true);
    });
  }

  const hasCounters = await db.schema.hasTable("order_counters");
  if (!hasCounters) {
    await db.schema.createTable("order_counters", (t) => {
      t.uuid("id").primary();
      t.uuid("restaurant_id").notNullable();
      t.date("date").notNullable();
      t.integer("counter").defaultTo(0);
      t.timestamps(true, true);
    });
  }
}

up()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
