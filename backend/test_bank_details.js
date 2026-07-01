import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB successfully.");

    // Clean up any old test users
    await User.deleteMany({ email: "test_banking_details@example.com" });

    // 1. Create User with Bank Details
    console.log("1. Creating test user with bank details...");
    const testUser = await User.create({
      name: "Test Banking User",
      email: "test_banking_details@example.com",
      password: "password123",
      role: "employee",
      designation: "Software Engineer",
      bankDetails: {
        bankName: "Test National Bank",
        accountNumber: "987654321098",
        accountHolderName: "Test Banking User",
        ifscCode: "TEST0001234",
        branchName: "Downtown Branch"
      }
    });

    console.log("✓ User created successfully with ID:", testUser._id);

    // 2. Fetch User and verify bank details
    console.log("2. Verifying bank details in DB...");
    const fetchedUser = await User.findOne({ email: "test_banking_details@example.com" });
    if (!fetchedUser) {
      throw new Error("User was not found in DB.");
    }

    console.log("Fetched User Bank Details:", fetchedUser.bankDetails);
    
    if (fetchedUser.bankDetails.bankName !== "Test National Bank" ||
        fetchedUser.bankDetails.accountNumber !== "987654321098" ||
        fetchedUser.bankDetails.accountHolderName !== "Test Banking User" ||
        fetchedUser.bankDetails.ifscCode !== "TEST0001234" ||
        fetchedUser.bankDetails.branchName !== "Downtown Branch") {
      throw new Error("Bank details do not match the expected values.");
    }

    console.log("✓ Bank details successfully verified!");

    // 3. Update Bank Details
    console.log("3. Updating bank details...");
    fetchedUser.bankDetails = {
      bankName: "Updated Chase Bank",
      accountNumber: "111222333444",
      accountHolderName: "Test Banking User (Updated)",
      ifscCode: "CHAS0009876",
      branchName: "Midtown Branch"
    };

    await fetchedUser.save();
    console.log("✓ User bank details updated.");

    // 4. Verify Updated Bank Details
    console.log("4. Verifying updated bank details in DB...");
    const fetchedUpdatedUser = await User.findOne({ email: "test_banking_details@example.com" });
    console.log("Updated User Bank Details:", fetchedUpdatedUser.bankDetails);

    if (fetchedUpdatedUser.bankDetails.bankName !== "Updated Chase Bank" ||
        fetchedUpdatedUser.bankDetails.accountNumber !== "111222333444" ||
        fetchedUpdatedUser.bankDetails.accountHolderName !== "Test Banking User (Updated)" ||
        fetchedUpdatedUser.bankDetails.ifscCode !== "CHAS0009876" ||
        fetchedUpdatedUser.bankDetails.branchName !== "Midtown Branch") {
      throw new Error("Updated bank details do not match expected values.");
    }

    console.log("✓ Updated bank details successfully verified!");

    // 5. Clean up
    console.log("5. Cleaning up test user...");
    await User.deleteOne({ _id: fetchedUpdatedUser._id });
    console.log("✓ Cleaned up.");

  } catch (error) {
    console.error("✗ Verification failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

run();
