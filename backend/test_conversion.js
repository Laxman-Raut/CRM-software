import mongoose from "mongoose";
import dotenv from "dotenv";
import Lead from "./models/Lead.js";
import Customer from "./models/Customer.js";

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB successfully.");

    const wonLeadsCount = await Lead.countDocuments({ status: "Won" });
    const customersCount = await Customer.countDocuments();

    console.log(`Leads with status 'Won': ${wonLeadsCount}`);
    console.log(`Total Customers in collection: ${customersCount}`);

    const wonLeads = await Lead.find({ status: "Won" });
    for (const lead of wonLeads) {
      const cust = await Customer.findOne({ sourceLead: lead._id });
      if (cust) {
        console.log(`Verification: Won lead "${lead.name}" HAS a corresponding customer "${cust.customerName}".`);
      } else {
        console.log(`Migration: Won lead "${lead.name}" is missing a customer. Creating one...`);
        await Customer.create({
          customerName: lead.name,
          company: lead.company || "",
          email: lead.email,
          phone: lead.phone,
          sourceLead: lead._id,
          value: lead.value || 0,
          notes: lead.notes || [],
          status: "Active"
        });
      }
    }

  } catch (error) {
    console.error("Verification script failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

run();
