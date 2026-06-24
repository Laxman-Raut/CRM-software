import express from "express";
import {
  getLeads,
  createLead,
  updateLead,
  deleteLead,
  addLeadNote,
  importLeadsCSV,
} from "../controllers/leadController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getLeads);
router.post("/", protect, createLead);
router.put("/:id", protect, updateLead);
router.delete("/:id", protect, deleteLead);
router.post("/:id/notes", protect, addLeadNote);
router.post("/import", protect, importLeadsCSV);

export default router;
