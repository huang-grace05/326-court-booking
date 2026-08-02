import app from "./app.js";
import { connectDatabase } from "./config/database.js";

const port = process.env.PORT || 3000;

try {
  await connectDatabase();
  app.listen(port, () => {
    console.log(`Court Booking server running at http://localhost:${port}`);
  });
} catch (error) {
  console.error("Could not connect to MongoDB:", error.message);
  process.exitCode = 1;
}
