import mongoose from "mongoose";
import dotenv from "dotenv";
import Lead from "./models/Lead.js";
import Deal from "./models/Deal.js";
import Customer from "./models/Customer.js";

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB successfully.");

    // 1. Find all won leads
    const wonLeads = await Lead.find({ status: "Won" });
    console.log(`Found ${wonLeads.length} leads with status 'Won'.`);

    for (const lead of wonLeads) {
      let deal = await Deal.findOne({ sourceLead: lead._id });
      if (!deal) {
        console.log(`Migration: Creating Deal for Won lead "${lead.name}"...`);
        deal = await Deal.create({
          dealName: lead.name,
          company: lead.company || "",
          email: lead.email,
          phone: lead.phone,
          sourceLead: lead._id,
          value: lead.value || 0,
          notes: lead.notes || [],
          stage: "Won", // Mark as won since the lead was won and customer was already made
          status: "Won"
        });
      }

      // Link any existing Customer for this lead to the Deal
      const cust = await Customer.findOne({ sourceLead: lead._id });
      if (cust) {
        if (!cust.sourceDeal) {
          cust.sourceDeal = deal._id;
          await cust.save();
          console.log(`Migration: Linked Customer "${cust.customerName}" to Deal "${deal.dealName}".`);
        }
      }
    }

    const totalDeals = await Deal.countDocuments();
    const totalCustomers = await Customer.countDocuments();

    console.log(`Total Deals in database: ${totalDeals}`);
    console.log(`Total Customers in database: ${totalCustomers}`);

  } catch (error) {
    console.error("Migration/Verification failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

run();
