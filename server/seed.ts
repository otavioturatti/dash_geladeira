import { db } from "./db";
import { users, products } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  // Add initial users
  const initialUsers = [
    { name: "Ana" },
    { name: "Carlos" },
    { name: "Beatriz" },
  ];

  for (const user of initialUsers) {
    await db.insert(users).values(user).onConflictDoNothing();
  }

  // Add initial products
  const initialProducts = [
    { name: "Monster Energy", price: 7.00, type: "monster", icon: "Zap" },
    { name: "Coca-Cola Zero", price: 5.00, type: "coke", icon: "Droplets" },
  ];

  for (const product of initialProducts) {
    await db.insert(products).values(product).onConflictDoNothing();
  }

  console.log("Database seeded successfully!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Error seeding database:", error);
  process.exit(1);
});
