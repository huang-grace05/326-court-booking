import path from "node:path";
import { fileURLToPath } from "node:url";

import express from "express";

import pageRoutes from "./routes/pageRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use("/", pageRoutes);
app.use("/reservations", reservationRoutes);

export default app;
