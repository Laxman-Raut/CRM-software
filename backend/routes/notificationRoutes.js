import express from "express";
import {
  getNotifications,
  markNotificationRead,
  markAllRead,
  deleteNotification
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes are protected
router.use(protect);

router.get("/", getNotifications);
router.put("/read-all", markAllRead);
router.put("/:id/read", markNotificationRead);
router.delete("/:id", deleteNotification);

export default router;
