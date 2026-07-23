import express from "express";

import {
  createReservation,
  showReservationsPage,
} from "../controllers/reservationController.js";

const router = express.Router();

router.get("/", showReservationsPage);
router.post("/", createReservation);

export default router;
