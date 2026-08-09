import express from "express";
import {
  createReservation,
  showReservationsPage,
  cancelReservation,
} from "../controllers/reservationController.js";
import { requireLogin } from "../middleware/requireLogin.js";
const router = express.Router();
router.get("/", requireLogin, showReservationsPage);
router.post("/", requireLogin, createReservation);
router.delete("/:id", requireLogin, cancelReservation);
export default router;
