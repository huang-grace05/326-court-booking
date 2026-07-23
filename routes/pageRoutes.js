import express from "express";

import {
  showCourtsPage,
  showHomePage,
  showPlayersPage,
} from "../controllers/pageController.js";

const router = express.Router();

router.get("/", showHomePage);
router.get("/courts", showCourtsPage);
router.get("/players", showPlayersPage);

export default router;
