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
      t.integer("monthly_capacity").defaultTo(1000);
      t.string("status").defaultTo("active");
      t.json("settings");
      t.timestamps(true, true);
    });
  }

  const hasUsers = await db.schema.hasTable("users");
  if (!hasUsers) {
    await db.schema.createTable("users", (t) => {
      t.uuid("id").primary();
      t.string("email").notNullable().unique();
      t.string("password_hash").notNullable();
      t.string("role").notNullable();
      t.uuid("restaurant_id");
      t.timestamps(true, true);
    });
  }

  const hasMenu = await db.schema.hasTable("menu_items");
  if (!hasMenu) {
    await db.schema.createTable("menu_items", (t) => {
      t.uuid("id").primary();
      t.uuid("restaurant_id").notNullable();
      t.string("name").notNullable();
      t.text("description");
      t.integer("price_cents").notNullable();
      t.string("currency").defaultTo("USD");
      t.json("images");
      t.boolean("available").defaultTo(true);
      t.timestamps(true, true);
    });
  }

  const hasOrders = await db.schema.hasTable("orders");
  if (!hasOrders) {
    await db.schema.createTable("orders", (t) => {
      t.uuid("id").primary();
      t.uuid("restaurant_id").notNullable();
      t.json("items").notNullable();
      t.integer("total_cents").notNullable();
      t.string("status").defaultTo("new");
      t.timestamps(true, true);
    });
  }

  const hasCounters = await db.schema.hasTable("order_counters");
  if (!hasCounters) {
    await db.schema.createTable("order_counters", (t) => {
      t.uuid("id").primary();
      t.uuid("restaurant_id").notNullable();
      // ...add more columns as needed...
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
