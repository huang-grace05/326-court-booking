import { randomBytes } from "node:crypto";

import MongoStore from "connect-mongo";
import session from "express-session";

import { getMongoUri } from "./database.js";

const ONE_DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const developmentSessionSecret = randomBytes(32).toString("hex");

export function createSessionMiddleware(options = {}) {
  const isProduction = process.env.NODE_ENV === "production";
  const secret = resolveSessionSecret(options.secret, isProduction);
  const store = options.store ?? createSessionStore();

  return session({
    name: "courtBooking.sid",
    secret,
    store,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: ONE_DAY_IN_MILLISECONDS,
    },
  });
}

function createSessionStore() {
  if (process.env.NODE_ENV === "test") {
    return new session.MemoryStore();
  }

  return MongoStore.create({
    mongoUrl: getMongoUri(),
    touchAfter: 24 * 60 * 60,
  });
}

function resolveSessionSecret(configuredSecret, isProduction) {
  const secret = configuredSecret || process.env.SESSION_SECRET;

  if (secret) {
    if (isProduction && Buffer.byteLength(secret, "utf8") < 32) {
      throw new Error("SESSION_SECRET must contain at least 32 bytes.");
    }
    return secret;
  }

  if (isProduction) {
    throw new Error("SESSION_SECRET is required in production.");
  }

  return developmentSessionSecret;
}
