
import Attendance from "../model/attendance.js";

// Employee Check In
export const checkIn = async (req, res) => {
  try {
    const today = new Date();

    const existingAttendance = await Attendance.findOne({
      employee: req.user._id,
      date: {
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lte: new Date(today.setHours(23, 59, 59, 999)),
      },
    });

    if (existingAttendance) {
      return res.status(400).json({
        message: "You have already checked in today",
      });
    }

    const attendance = await Attendance.create({
      employee: req.user._id,
      date: new Date(),
      checkIn: new Date(),
      status: "Present",
    });

    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Employee Check Out
export const checkOut = async (req, res) => {
  try {
    const today = new Date();

    const attendance = await Attendance.findOne({
      employee: req.user._id,
      date: {
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lte: new Date(today.setHours(23, 59, 59, 999)),
      },
    });

    if (!attendance) {
      return res.status(404).json({
        message: "No check-in found for today",
      });
    }

    attendance.checkOut = new Date();

    await attendance.save();

    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get My Attendance
export const getMyAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({
      employee: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get All Attendance (Admin / Managers)
export const getAllAttendance = async (req, res) => {
  try {
    if (!req.user.resolvedPermissions.includes("attendance:read")) {
      return res.status(403).json({
        message: "Access Denied: You do not have permission to view all attendance records.",
      });
    }

    const records = await Attendance.find({})
      .populate("employee", "name email designation")
      .sort({ date: -1, createdAt: -1 });

    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};