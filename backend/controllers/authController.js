import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Normalizing email to lowercase since we save it as lowercase
    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({
        message: "Invalid Email",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid Password",
      });
    }

    const token = jwt.sign(
      { id: user._id,
        role : user.role,
       },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Fetch permissions from Role
    let permissionsObj = {
      canViewLeads: false,
      canUpdateLeads: false,
      canDeleteLeads: false,
    };
    let resolvedPermissionsList = [];

    if (user.role && user.role.toLowerCase() === "admin") {
      permissionsObj = {
        canViewLeads: true,
        canUpdateLeads: true,
        canDeleteLeads: true,
      };
      resolvedPermissionsList = [
        "leads:read", "leads:create", "leads:update", "leads:delete",
        "customers:read", "customers:create", "customers:update", "customers:delete",
        "deals:read", "deals:create", "deals:update", "deals:delete",
        "tasks:read", "tasks:create", "tasks:update", "tasks:delete",
        "employees:manage", "settings:manage"
      ];
    } else if (user.role) {
      const Role = (await import("../models/Role.js")).default;
      const roleObj = await Role.findOne({ name: { $regex: new RegExp(`^${user.role}$`, 'i') } });
      if (roleObj) {
        resolvedPermissionsList = roleObj.permissions;
        permissionsObj = {
          canViewLeads: roleObj.permissions.includes("leads:read"),
          canUpdateLeads: roleObj.permissions.includes("leads:create") || roleObj.permissions.includes("leads:update"),
          canDeleteLeads: roleObj.permissions.includes("leads:delete"),
        };
      }
    }

    res.status(200).json({
      token,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: permissionsObj,
      resolvedPermissions: resolvedPermissionsList,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail
    });

    if (!user) {
      return res.status(404).json({
        message: "Email not found"
      });
    }


    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();


    user.resetOTP = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;


    await user.save();


    await sendEmail(
      user.email,
      otp
    );


    res.json({
      message: "OTP sent successfully"
    });


  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase()
    });


    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }


    if (
      user.resetOTP !== otp ||
      user.otpExpiry < Date.now()
    ) {
      return res.status(400).json({
        message: "Invalid or expired OTP"
      });
    }


    res.json({
      message: "OTP verified",
      email: user.email
    });


  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

export const resetPassword = async (req,res)=>{
  try {

    const { email, password } = req.body;


    const user = await User.findOne({
      email: email.toLowerCase()
    });


    if(!user){
      return res.status(404).json({
        message:"User not found"
      });
    }


    user.password = await bcrypt.hash(
      password,
      10
    );


    user.resetOTP = undefined;
    user.otpExpiry = undefined;


    await user.save();


    res.json({
      message:"Password reset successful"
    });


  } catch(error){

    res.status(500).json({
      message:error.message
    });

  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name, password, bankDetails } = req.body;

    if (name) user.name = name;
    
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    if (bankDetails) {
      user.bankDetails = {
        bankName: bankDetails.bankName !== undefined ? bankDetails.bankName : (user.bankDetails?.bankName || ""),
        accountNumber: bankDetails.accountNumber !== undefined ? bankDetails.accountNumber : (user.bankDetails?.accountNumber || ""),
        accountHolderName: bankDetails.accountHolderName !== undefined ? bankDetails.accountHolderName : (user.bankDetails?.accountHolderName || ""),
        ifscCode: bankDetails.ifscCode !== undefined ? bankDetails.ifscCode : (user.bankDetails?.ifscCode || ""),
        branchName: bankDetails.branchName !== undefined ? bankDetails.branchName : (user.bankDetails?.branchName || ""),
      };
    }

    await user.save();

    const responseData = user.toObject();
    delete responseData.password;
    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};