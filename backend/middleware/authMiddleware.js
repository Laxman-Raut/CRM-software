import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        message: "User not found or deleted",
      });
    }

    // Resolve permissions based on user's role
    let resolvedPermissions = [];
    if (user.role && user.role.toLowerCase() === "admin") {
      resolvedPermissions = [
        "leads:read", "leads:create", "leads:update", "leads:delete",
        "customers:read", "customers:create", "customers:update", "customers:delete",
        "deals:read", "deals:create", "deals:update", "deals:delete",
        "tasks:read", "tasks:create", "tasks:update", "tasks:delete",
        "employees:manage", "settings:manage",
        "attendance:read", "attendance:manage"
      ];
    } else if (user.role) {
      const Role = (await import("../models/Role.js")).default;
      const roleObj = await Role.findOne({ name: { $regex: new RegExp(`^${user.role}$`, "i") } });
      if (roleObj) {
        resolvedPermissions = roleObj.permissions;
      }
    }

    req.user = user;
    req.user.resolvedPermissions = resolvedPermissions;

    next();
  } catch (error) {
    res.status(401).json({
      message: "Invalid token",
    });
  }
};