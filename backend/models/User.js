import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },


    // Forgot Password OTP
    resetOTP: {
      type: String,
    },

    otpExpiry: {
      type: Date,
    },


    designation: {
      type: String,
      default: "",
      trim: true,
    },

    role: {
      type: String,
      default: "employee",
    },

    permissions: {
      canViewLeads: {
        type: Boolean,
        default: false,
      },
      canUpdateLeads: {
        type: Boolean,
        default: false,
      },
      canDeleteLeads: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;