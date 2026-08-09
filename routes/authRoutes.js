import express from "express";
import rateLimit from "express-rate-limit";

import {
  login,
  logout,
  showLoginPage,
  showSignupPage,
  signup,
} from "../controllers/authController.js";

const router = express.Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many account attempts. Please try again in 15 minutes.",
});

router.get("/signup", showSignupPage);
router.post("/signup", authLimiter, signup);
router.get("/login", showLoginPage);
router.post("/login", authLimiter, login);
router.post("/logout", logout);

export default router;
