import db from "../db";
import { v4 as uuidv4 } from "uuid";
import { hash } from "../utils";

async function seed() {
  try {
    // Check if data already exists
    const existingUsers = await db("users").select("*");
    if (existingUsers.length > 0) {
      console.log("Seed data already exists, skipping...");
      return;
    }

    console.log("Creating seed data...");

    // Create demo restaurants
    const pizzaRestId = uuidv4();
    const burgerRestId = uuidv4();
    const sushiRestId = uuidv4();

    await db("restaurants").insert([
      {
        id: pizzaRestId,
        name: "Demo Pizza Palace",
        monthly_capacity: 1000,
        cuisine_type: "Italian",
        address: "123 Pizza Street, New York, NY 10001",
        phone: "+1 (555) 123-4567",
        email: "contact@demopizza.com",
        description: "Authentic Italian pizza made with fresh ingredients",
        logo_url: "https://dummyimage.com/200x200/ff6b6b/ffffff&text=Pizza",
        status: "active",
        gst_settings: JSON.stringify({ default_rate: 8.25, apply_to_all: true }),
        operating_hours: JSON.stringify({
          monday: { open: "11:00", close: "22:00" },
          tuesday: { open: "11:00", close: "22:00" },
          wednesday: { open: "11:00", close: "22:00" },
          thursday: { open: "11:00", close: "22:00" },
          friday: { open: "11:00", close: "23:00" },
          saturday: { open: "11:00", close: "23:00" },
          sunday: { open: "12:00", close: "21:00" }
        })
      },
      {
        id: burgerRestId,
        name: "Burger Barn",
        monthly_capacity: 800,
        cuisine_type: "American",
        address: "456 Burger Avenue, Los Angeles, CA 90210",
        phone: "+1 (555) 234-5678",
        email: "info@burgerbarn.com",
        description: "Gourmet burgers and craft beer in a rustic setting",
        logo_url: "https://dummyimage.com/200x200/4ecdc4/ffffff&text=Burger",
        status: "active",
        gst_settings: JSON.stringify({ default_rate: 9.5, apply_to_all: true }),
        operating_hours: JSON.stringify({
          monday: { open: "10:00", close: "23:00" },
          tuesday: { open: "10:00", close: "23:00" },
          wednesday: { open: "10:00", close: "23:00" },
          thursday: { open: "10:00", close: "23:00" },
          friday: { open: "10:00", close: "00:00" },
          saturday: { open: "10:00", close: "00:00" },
          sunday: { open: "11:00", close: "22:00" }
        })
      },
      {
        id: sushiRestId,
        name: "Sakura Sushi",
        monthly_capacity: 600,
        cuisine_type: "Japanese",
        address: "789 Sushi Lane, San Francisco, CA 94102",
        phone: "+1 (555) 345-6789",
        email: "hello@sakurasushi.com",
        description: "Fresh sushi and traditional Japanese cuisine",
        logo_url: "https://dummyimage.com/200x200/ff9ff3/ffffff&text=Sushi",
        status: "active",
        gst_settings: JSON.stringify({ default_rate: 8.75, apply_to_all: true }),
        operating_hours: JSON.stringify({
          monday: { open: "17:00", close: "22:00" },
          tuesday: { open: "17:00", close: "22:00" },
          wednesday: { open: "17:00", close: "22:00" },
          thursday: { open: "17:00", close: "22:00" },
          friday: { open: "17:00", close: "23:00" },
          saturday: { open: "17:00", close: "23:00" },
          sunday: { open: "17:00", close: "21:00" }
        })
      }
    ]);

    // Create users
    const pass = await hash("password");
    const superId = uuidv4();
    
    await db("users").insert([
      {
        id: superId,
        email: "super@octopoz.com",
        password_hash: pass,
        role: "super_admin",
        first_name: "Super",
        last_name: "Admin"
      },
      {
        id: uuidv4(),
        email: "admin@demopizza.com",
        password_hash: pass,
        role: "restaurant_admin",
        restaurant_id: pizzaRestId,
        first_name: "Pizza",
        last_name: "Manager"
      },
      {
        id: uuidv4(),
        email: "admin@burgerbarn.com",
        password_hash: pass,
        role: "restaurant_admin",
        restaurant_id: burgerRestId,
        first_name: "Burger",
        last_name: "Manager"
      },
      {
        id: uuidv4(),
        email: "admin@sakurasushi.com",
        password_hash: pass,
        role: "restaurant_admin",
        restaurant_id: sushiRestId,
        first_name: "Sushi",
        last_name: "Manager"
      }
    ]);

    // Create menu categories for Pizza Palace
    const pizzaCategoryIds = {
      appetizers: uuidv4(),
      pizzas: uuidv4(),
      pasta: uuidv4(),
      desserts: uuidv4(),
      beverages: uuidv4()
    };

    await db("menu_categories").insert([
      { id: pizzaCategoryIds.appetizers, restaurant_id: pizzaRestId, name: "Appetizers", description: "Start your meal right", sort_order: 1 },
      { id: pizzaCategoryIds.pizzas, restaurant_id: pizzaRestId, name: "Pizzas", description: "Our signature pizzas", sort_order: 2 },
      { id: pizzaCategoryIds.pasta, restaurant_id: pizzaRestId, name: "Pasta", description: "Traditional Italian pasta", sort_order: 3 },
      { id: pizzaCategoryIds.desserts, restaurant_id: pizzaRestId, name: "Desserts", description: "Sweet endings", sort_order: 4 },
      { id: pizzaCategoryIds.beverages, restaurant_id: pizzaRestId, name: "Beverages", description: "Drinks and more", sort_order: 5 }
    ]);

    // Create menu items for Pizza Palace
    await db("menu_items").insert([
      {
        id: uuidv4(),
        restaurant_id: pizzaRestId,
        category_id: pizzaCategoryIds.appetizers,
        name: "Garlic Bread",
        description: "Fresh baked bread with garlic butter and herbs",
        price_cents: 799,
        images: JSON.stringify(["https://dummyimage.com/300x200/ffd93d/6c5ce7&text=Garlic+Bread"]),
        prep_time_minutes: 10,
        gst_rate: 8.25,
        sort_order: 1
      },
      {
        id: uuidv4(),
        restaurant_id: pizzaRestId,
        category_id: pizzaCategoryIds.pizzas,
        name: "Margherita Pizza",
        description: "Classic pizza with tomato sauce, mozzarella, and fresh basil",
        price_cents: 1599,
        images: JSON.stringify(["https://dummyimage.com/300x200/ff6b6b/ffffff&text=Margherita"]),
        prep_time_minutes: 15,
        gst_rate: 8.25,
        sort_order: 1,
        dietary_info: JSON.stringify(["vegetarian"])
      },
      {
        id: uuidv4(),
        restaurant_id: pizzaRestId,
        category_id: pizzaCategoryIds.pizzas,
        name: "Pepperoni Pizza",
        description: "Classic pepperoni with mozzarella cheese",
        price_cents: 1899,
        images: JSON.stringify(["https://dummyimage.com/300x200/ff4757/ffffff&text=Pepperoni"]),
        prep_time_minutes: 15,
        gst_rate: 8.25,
        sort_order: 2
      },
      {
        id: uuidv4(),
        restaurant_id: pizzaRestId,
        category_id: pizzaCategoryIds.pasta,
        name: "Spaghetti Carbonara",
        description: "Traditional carbonara with eggs, cheese, and pancetta",
        price_cents: 1399,
        images: JSON.stringify(["https://dummyimage.com/300x200/fdcb6e/2d3436&text=Carbonara"]),
        prep_time_minutes: 12,
        gst_rate: 8.25,
        sort_order: 1
      }
    ]);

    // Create tables for restaurants
    const tableIds = [];
    for (let i = 1; i <= 10; i++) {
      const tableId = uuidv4();
      tableIds.push(tableId);
      await db("tables").insert({
        id: tableId,
        restaurant_id: pizzaRestId,
        table_number: i.toString(),
        capacity: i <= 6 ? 2 : i <= 8 ? 4 : 6,
        qr_code: `qr_code_table_${i}`
      });
    }

    console.log("✅ Seed data created successfully!");
    console.log("\n🔑 Login credentials:");
    console.log("Super Admin: super@octopoz.com / password");
    console.log("Pizza Manager: admin@demopizza.com / password");
    console.log("Burger Manager: admin@burgerbarn.com / password");
    console.log("Sushi Manager: admin@sakurasushi.com / password");
    console.log("\n🏪 Demo restaurants created:");
    console.log("- Demo Pizza Palace (Italian)");
    console.log("- Burger Barn (American)");
    console.log("- Sakura Sushi (Japanese)");

  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
