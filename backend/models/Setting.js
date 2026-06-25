import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    crmName: {
      type: String,
      default: "Sales CRM",
      trim: true,
    },
    currency: {
      type: String,
      enum: ["INR", "USD", "EUR", "GBP"],
      default: "INR",
    },
    companyName: {
      type: String,
      default: "",
      trim: true,
    },
    supportEmail: {
      type: String,
      default: "",
      trim: true,
    },
    supportPhone: {
      type: String,
      default: "",
      trim: true,
    },
    allowEmployeeViewCustomers: {
      type: Boolean,
      default: true,
    },
    emailUser: {
      type: String,
      default: "",
      trim: true,
    },
    emailPasskey: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Setting", settingSchema);
