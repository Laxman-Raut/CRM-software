import express from "express";
import {
  getEmployees,
  createEmployee,
  updateEmployeePermissions,
  deleteEmployee,
  updateEmployee,
} from "../controllers/employeeController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All employee endpoints require authentication
router.get("/", protect, getEmployees);
router.post("/", protect, createEmployee);
router.put("/:id", protect, updateEmployee);
router.put("/:id/permissions", protect, updateEmployeePermissions);
router.delete("/:id", protect, deleteEmployee);

export default router;
