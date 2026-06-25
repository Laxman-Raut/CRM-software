import express from "express";
import {
  getDeals,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal,
  addDealNote,
} from "../controllers/dealController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getDeals);
router.get("/:id", protect, getDealById);
router.post("/", protect, createDeal);
router.put("/:id", protect, updateDeal);
router.delete("/:id", protect, deleteDeal);
router.post("/:id/notes", protect, addDealNote);

export default router;
