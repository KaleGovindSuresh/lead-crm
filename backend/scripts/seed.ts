import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { UserModel } from "../src/models/user.model";
import { LeadModel } from "../src/models/lead.model";

dotenv.config();

// ─── Seed Data ────────────────────────────────────────────────────────────────

const seedUsers = [
  {
    name: "Admin User",
    email: "admin@example.com",
    password: "Admin@123",
    role: "admin",
  },
  {
    name: "Manager User",
    email: "manager@example.com",
    password: "Manager@123",
    role: "manager",
  },
  {
    name: "Sales User 1",
    email: "sales1@example.com",
    password: "Sales@123",
    role: "sales",
  },
  {
    name: "Sales User 2",
    email: "sales2@example.com",
    password: "Sales@123",
    role: "sales",
  },
];

async function seed() {
  const MONGO_URI =
    process.env["MONGO_URI"] ?? "mongodb://localhost:27017/crm_plus";

  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected");

  // Clear collections
  console.log("🧹 Clearing existing data...");
  // await Promise.all([User.deleteMany({}), Lead.deleteMany({})]);

  // Create users
  console.log("👥 Seeding users...");
  const saltRounds = 12;

  const createdUsers: Record<string, mongoose.Types.ObjectId> = {};

  for (const u of seedUsers) {
    const passwordHash = await bcrypt.hash(u.password, saltRounds);
    const user = await UserModel.create({
      name: u.name,
      email: u.email,
      passwordHash,
      role: u.role,
    });
    createdUsers[
      u.role === "sales" && !createdUsers["sales1"] ? "sales1" : u.role
    ] = user._id as mongoose.Types.ObjectId;
    console.log(`  ✓ ${u.role}: ${u.email} / ${u.password}`);
  }

  // Re-fetch to get correct IDs
  const admin = await UserModel.findOne({ email: "admin@example.com" });
  const manager = await UserModel.findOne({ email: "manager@example.com" });
  const sales1 = await UserModel.findOne({ email: "sales1@example.com" });
  const sales2 = await UserModel.findOne({ email: "sales2@example.com" });

  // Create sample leads
  console.log("📋 Seeding leads...");

  const sampleLeads = [
    {
      name: "Govind Kale",
      phone: "+91 91308 14932",
      email: "govind.kale@example.com",
      source: "website",
      status: "new",
      notes: "Interested in enterprise plan",
      createdBy: sales1!._id,
      assignedTo: sales1!._id,
    },
    {
      name: "Priya Sharma",
      phone: "+91 87654 32109",
      email: "priya.sharma@example.com",
      source: "referral",
      status: "contacted",
      notes: "Referred by existing customer",
      createdBy: sales1!._id,
      assignedTo: sales2!._id,
    },
    {
      name: "Amit Patel",
      phone: "+91 76543 21098",
      source: "cold",
      status: "qualified",
      notes: "Decision maker, budget approved",
      createdBy: sales2!._id,
      assignedTo: sales2!._id,
    },
    {
      name: "Sunita Verma",
      phone: "+91 65432 10987",
      email: "sunita.v@company.co",
      source: "website",
      status: "won",
      notes: "Closed deal — 12 month contract",
      createdBy: manager!._id,
      assignedTo: sales1!._id,
    },
    {
      name: "Karan Joshi",
      phone: "+91 54321 09876",
      source: "other",
      status: "lost",
      notes: "Went with competitor",
      createdBy: sales2!._id,
      assignedTo: null,
    },
    {
      name: "Deepika Nair",
      phone: "+91 43210 98765",
      email: "deepika@startup.io",
      source: "referral",
      status: "new",
      notes: "Startup — needs flexible pricing",
      createdBy: admin!._id,
      assignedTo: sales1!._id,
    },
    {
      name: "Vikram Singh",
      phone: "+91 32109 87654",
      source: "cold",
      status: "contacted",
      createdBy: sales1!._id,
      assignedTo: null,
    },
    {
      name: "Ananya Reddy",
      phone: "+91 21098 76543",
      email: "ananya.r@enterprise.com",
      source: "website",
      status: "qualified",
      notes: "Large team, high value",
      createdBy: manager!._id,
      assignedTo: sales2!._id,
    },
    {
      name: "Rahul Gupta",
      phone: "+91 10987 65432",
      source: "other",
      status: "new",
      createdBy: sales2!._id,
      assignedTo: sales2!._id,
    },
    {
      name: "Meera Iyer",
      phone: "+91 98076 54321",
      email: "meera@techcorp.in",
      source: "referral",
      status: "won",
      notes: "Upsell from small to medium plan",
      createdBy: admin!._id,
      assignedTo: sales1!._id,
    },
  ];

  await LeadModel.insertMany(sampleLeads);
  console.log(`  ✓ ${sampleLeads.length} leads created`);

  console.log("\n🎉 Seed complete!\n");
  console.log("─── Login Credentials ───────────────────────────");
  console.log("  Admin:    admin@example.com    / Admin@123");
  console.log("  Manager:  manager@example.com  / Manager@123");
  console.log("  Sales 1:  sales1@example.com   / Sales@123");
  console.log("  Sales 2:  sales2@example.com   / Sales@123");
  console.log("─────────────────────────────────────────────────\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
