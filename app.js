import "dotenv/config";

import path from "node:path";
import { fileURLToPath } from "node:url";

import express from "express";
import helmet from "helmet";

import { createSessionMiddleware } from "./config/session.js";
import authRoutes from "./routes/authRoutes.js";
import pageRoutes from "./routes/pageRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  app.set("trust proxy", 1);
}

const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      scriptSrc: ["'self'", "https://unpkg.com"],
      upgradeInsecureRequests: isProduction ? [] : null,
    },
  },
};

if (!isProduction) {
  helmetOptions.strictTransportSecurity = false;
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(helmet(helmetOptions));
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(createSessionMiddleware());
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user ?? null;
  next();
});

app.use("/", authRoutes);
app.use("/", pageRoutes);
app.use("/reservations", reservationRoutes);

export default app;
