import express from "express";

import {
  getEvents,
  createEvent,
  deleteEvent,
} from "../controllers/eventController.js";

const router = express.Router();

router.get("/", getEvents);
router.post("/", createEvent);
router.delete("/:id", deleteEvent);

export default router;