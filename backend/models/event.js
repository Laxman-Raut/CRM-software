import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    type: {
      type: String,
      enum: ["meeting", "call", "task", "other"],
      default: "meeting",
    },
    date: {
      type: Date,
      required: true,
    },
    createdby: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "employee",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Event", eventSchema);
