import express from "express";
import {
  createReservation,
  showReservationsPage,
  cancelReservation,
} from "../controllers/reservationController.js";
const router = express.Router();
router.get("/", showReservationsPage);
router.post("/", createReservation);
router.delete("/:id", cancelReservation);
export default router;