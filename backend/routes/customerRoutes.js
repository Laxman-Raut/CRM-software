import express from "express";
import {
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  addCustomerNote,
} from "../controllers/customerController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getCustomers);
router.get("/:id", protect, getCustomerById);
router.put("/:id", protect, updateCustomer);
router.delete("/:id", protect, deleteCustomer);
router.post("/:id/notes", protect, addCustomerNote);

export default router;
