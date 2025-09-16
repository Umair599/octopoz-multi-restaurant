import db from "../db";
import { v4 as uuidv4 } from "uuid";
import { hash } from "../utils";

async function seed() {
  // create a super admin and a demo restaurant
  const superId = uuidv4();
  const restId = uuidv4();
  await db("restaurants").insert({
    id: restId,
    name: "Demo Pizza",
    monthly_capacity: 50,
  });
  const pass = await hash("password");
  await db("users").insert([
    {
      id: superId,
      email: "super@octopoz.example",
      password_hash: pass,
      role: "super_admin",
    },
    {
      id: uuidv4(),
      email: "admin@demo.example",
      password_hash: pass,
      role: "restaurant_admin",
      restaurant_id: restId,
    },
  ]);
  console.log("Seed done");
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
