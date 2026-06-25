import mongoose from "mongoose";
import Role from "../models/Role.js";

const seedRoles = async () => {
  try {
    const defaultRoles = [
      {
        name: "Admin",
        description: "Administrator role with full access to everything",
        isSystem: true,
        permissions: [
          "leads:read", "leads:create", "leads:update", "leads:delete",
          "customers:read", "customers:create", "customers:update", "customers:delete",
          "deals:read", "deals:create", "deals:update", "deals:delete",
          "tasks:read", "tasks:create", "tasks:update", "tasks:delete",
          "employees:manage", "settings:manage"
        ]
      },
      {
        name: "Manager",
        description: "Manager role with access to operational data but no settings or user management",
        isSystem: true,
        permissions: [
          "leads:read", "leads:create", "leads:update", "leads:delete",
          "customers:read", "customers:create", "customers:update", "customers:delete",
          "deals:read", "deals:create", "deals:update", "deals:delete",
          "tasks:read", "tasks:create", "tasks:update", "tasks:delete"
        ]
      },
      {
        name: "Employee",
        description: "Standard employee role with basic access to view and update leads, customers, and deals",
        isSystem: true,
        permissions: [
          "leads:read", "leads:update",
          "customers:read",
          "deals:read",
          "tasks:read"
        ]
      }
    ];

    for (const r of defaultRoles) {
      const exists = await Role.findOne({ name: r.name });
      if (!exists) {
        await Role.create(r);
        console.log(`Seeded default role: ${r.name}`);
      }
    }
  } catch (error) {
    console.error("Error seeding default roles:", error);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(
      `MongoDB Connected: ${conn.connection.host}`
    );
    
    // Seed default system roles
    await seedRoles();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

export default connectDB;