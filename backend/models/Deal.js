import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["Note", "Call", "Email", "Meeting"],
      default: "Note",
    },
    authorName: {
      type: String,
      default: "System",
    },
  },
  {
    timestamps: true,
  }
);

const dealSchema = new mongoose.Schema(
  {
    dealName: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    stage: {
      type: String,
      enum: ["Proposal", "Negotiation", "Won", "Lost"],
      default: "Proposal",
    },
    status: {
      type: String,
      enum: ["Active", "Won", "Lost"],
      default: "Active",
    },
    value: {
      type: Number,
      default: 0,
    },
    sourceLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
    },
    products: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, default: 1 },
        price: { type: Number, default: 0 }
      }
    ],
    notes: [noteSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Deal", dealSchema);
