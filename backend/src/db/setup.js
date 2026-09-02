// Creates the tables from schema.sql and fills them with a small set of demo data.
// Safe to re-run: schema.sql drops the tables before recreating them.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { query, closePool } from "../db.js";

const here = dirname(fileURLToPath(import.meta.url));

// Every demo account uses this. It satisfies the 8-16 character, one uppercase,
// one special character rule.
const DEMO_PASSWORD = "Password@123";

// Names have to be at least 20 characters, which is why the demo data uses full
// names and long store names.
const USERS = [
  {
    name: "Kshitij Bachhav Platform Admin",
    email: "admin@storerating.com",
    address: "IIIT Nagpur, Butibori, Nagpur, Maharashtra 441108",
    role: "admin",
  },
  {
    name: "Priya Deshmukh Rajendra",
    email: "priya.deshmukh@example.com",
    address: "14 Shivaji Nagar, Pune, Maharashtra 411005",
    role: "user",
  },
  {
    name: "Aditya Ramkrishna Joshi",
    email: "aditya.joshi@example.com",
    address: "88 Civil Lines, Nagpur, Maharashtra 440001",
    role: "user",
  },
  {
    name: "Sneha Vaishnavi Patil",
    email: "sneha.patil@example.com",
    address: "5 MG Road, Bengaluru, Karnataka 560001",
    role: "user",
  },
  {
    name: "Rahul Kulkarni Shopkeeper",
    email: "rahul.kulkarni@example.com",
    address: "22 Laxmi Road, Pune, Maharashtra 411030",
    role: "owner",
  },
  {
    name: "Meera Anantha Iyer Stores",
    email: "meera.iyer@example.com",
    address: "9 Anna Salai, Chennai, Tamil Nadu 600002",
    role: "owner",
  },
];

const STORES = [
  {
    name: "Kulkarni Family Grocery Mart",
    email: "contact@kulkarnigrocery.com",
    address: "22 Laxmi Road, Pune, Maharashtra 411030",
    ownerEmail: "rahul.kulkarni@example.com",
  },
  {
    name: "Iyer Electronics And Repairs",
    email: "hello@iyerelectronics.com",
    address: "9 Anna Salai, Chennai, Tamil Nadu 600002",
    ownerEmail: "meera.iyer@example.com",
  },
  {
    name: "Nagpur Central Book Depot",
    email: "orders@nagpurbookdepot.com",
    address: "31 Sitabuldi Main Road, Nagpur, Maharashtra 440012",
    ownerEmail: null,
  },
];

// [rater email, store email, score]
const RATINGS = [
  ["priya.deshmukh@example.com", "contact@kulkarnigrocery.com", 5],
  ["aditya.joshi@example.com", "contact@kulkarnigrocery.com", 4],
  ["sneha.patil@example.com", "contact@kulkarnigrocery.com", 4],
  ["priya.deshmukh@example.com", "hello@iyerelectronics.com", 3],
  ["aditya.joshi@example.com", "hello@iyerelectronics.com", 2],
  ["sneha.patil@example.com", "orders@nagpurbookdepot.com", 5],
];

async function main() {
  console.log("Creating tables...");
  const schema = readFileSync(join(here, "schema.sql"), "utf8");
  await query(schema);

  console.log("Adding users...");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const userIdByEmail = {};
  for (const user of USERS) {
    const result = await query(
      `INSERT INTO users (name, email, password_hash, address, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [user.name, user.email, passwordHash, user.address, user.role]
    );
    userIdByEmail[user.email] = result.rows[0].id;
  }

  console.log("Adding stores...");
  const storeIdByEmail = {};
  for (const store of STORES) {
    const result = await query(
      `INSERT INTO stores (name, email, address, owner_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [
        store.name,
        store.email,
        store.address,
        store.ownerEmail ? userIdByEmail[store.ownerEmail] : null,
      ]
    );
    storeIdByEmail[store.email] = result.rows[0].id;
  }

  console.log("Adding ratings...");
  for (const [raterEmail, storeEmail, score] of RATINGS) {
    await query(
      "INSERT INTO ratings (user_id, store_id, score) VALUES ($1, $2, $3)",
      [userIdByEmail[raterEmail], storeIdByEmail[storeEmail], score]
    );
  }

  console.log(`\nDone. Every demo account uses the password ${DEMO_PASSWORD}`);
  console.log("  admin  admin@storerating.com");
  console.log("  user   priya.deshmukh@example.com");
  console.log("  owner  rahul.kulkarni@example.com");
}

main()
  .catch((error) => {
    console.error("Setup failed:", error.message);
    process.exitCode = 1;
  })
  .finally(closePool);
