import express from "express";
import {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
} from "../controller/attendanceController.js";

import { protect } from "../../../middleware/authMiddleware.js"

const router = express.Router();

// Employee Check In
router.post("/checkin", protect, checkIn);

// Employee Check Out
router.post("/checkout", protect, checkOut);

// Employee Attendance History
router.get("/my-attendance", protect, getMyAttendance);

// Get All Attendance (Admin / Managers)
router.get("/all", protect, getAllAttendance);

export default router;