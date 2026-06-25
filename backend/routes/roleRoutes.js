import express from "express";
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
} from "../controllers/roleController.js";
import { protect } from "../middleware/authMiddleware.js";
import { checkPermission } from "../middleware/checkPermission.js";

const router = express.Router();

router.get("/", protect, getRoles);
router.post("/", protect, checkPermission("employees:manage"), createRole);
router.put("/:id", protect, checkPermission("employees:manage"), updateRole);
router.delete("/:id", protect, checkPermission("employees:manage"), deleteRole);

export default router;
