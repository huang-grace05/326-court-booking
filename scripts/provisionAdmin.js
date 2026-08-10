import "dotenv/config";

import mongoose from "mongoose";

import { connectDatabase } from "../config/database.js";
import {
  provisionAdmin,
  AuthValidationError,
} from "../services/authService.js";

async function main() {
  const credentials = {
    name: process.env.ADMIN_NAME,
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  };
  const missingVariables = Object.entries(credentials)
    .filter(([, value]) => !value)
    .map(([name]) => `ADMIN_${name.toUpperCase()}`);

  if (missingVariables.length > 0) {
    console.error(
      `Missing required environment variables: ${missingVariables.join(", ")}`,
    );
    process.exitCode = 1;
    return;
  }

  try {
    await connectDatabase();
    const admin = await provisionAdmin(credentials);
    console.log(`Admin account created for ${admin.email}.`);
  } catch (error) {
    if (error instanceof AuthValidationError) {
      console.error(error.message);
      Object.values(error.errors).forEach((message) => {
        console.error(message);
      });
    } else {
      console.error("Could not create the admin account.");
    }
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

await main();
