import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
    },
    company: String,
    email: String,
    phone: String,

    sourceLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
    },

    sourceDeal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deal",
    },

    value: {
      type: Number,
      default: 0,
    },

    purchases: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, default: 1 },
        price: { type: Number, default: 0 },
        purchaseDate: { type: Date, default: Date.now }
      }
    ],

    notes: [],

    status: {
      type: String,
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Customer", customerSchema);