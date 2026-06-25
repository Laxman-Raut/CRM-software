import express from "express";
import {
  getEmployees,
  createEmployee,
  updateEmployeePermissions,
  deleteEmployee,
  updateEmployee,
} from "../controllers/employeeController.js";
import { protect } from "../middleware/authMiddleware.js";
import { checkPermission } from "../middleware/checkPermission.js";

const router = express.Router();

// All employee endpoints require authentication
router.get("/", protect, getEmployees);
router.post("/", protect, checkPermission("employees:manage"), createEmployee);
router.put("/:id", protect, checkPermission("employees:manage"), updateEmployee);
router.put("/:id/permissions", protect, checkPermission("employees:manage"), updateEmployeePermissions);
router.delete("/:id", protect, checkPermission("employees:manage"), deleteEmployee);

export default router;
