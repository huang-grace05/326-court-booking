import bcrypt from "bcrypt";

import {
  createUser,
  findUserByEmail,
} from "../repositories/usersRepository.js";

const SALT_ROUNDS = 12;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DUMMY_PASSWORD_HASH =
  "$2b$12$NrzEWYhErDZ8rd3vU0ydPexN.Vuk1i2gnLIugqebUkpSJILZhNrsS";

export class AuthValidationError extends Error {
  constructor(errors) {
    super("Please fix the account details below.");
    this.name = "AuthValidationError";
    this.errors = errors;
  }
}

export class AuthCredentialsError extends Error {
  constructor() {
    super("Email or password is incorrect.");
    this.name = "AuthCredentialsError";
  }
}

export async function registerUser(input = {}, options = {}) {
  const signup = cleanSignupInput(input);
  const errors = validateSignup(signup);

  if (Object.keys(errors).length > 0) {
    throw new AuthValidationError(errors);
  }

  const existingUser = await findUserByEmail(signup.email);
  if (existingUser) {
    throw new AuthValidationError({
      email: "An account with this email already exists.",
    });
  }

  const passwordHash = await bcrypt.hash(signup.password, SALT_ROUNDS);
  const role = isAdminEmail(signup.email, options.adminEmails) ? "admin" : "member";

  try {
    const user = await createUser({
      name: signup.name,
      email: signup.email,
      passwordHash,
      role,
    });
    return toPublicUser(user);
  } catch (error) {
    if (error?.code === 11000) {
      throw new AuthValidationError({
        email: "An account with this email already exists.",
      });
    }
    throw error;
  }
}

export async function authenticateUser(input = {}) {
  const email = String(input.email ?? "").trim().toLowerCase();
  const password = String(input.password ?? "");
  const user = email ? await findUserByEmail(email) : null;
  const passwordMatches = await bcrypt.compare(
    password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );

  if (!user || !passwordMatches) {
    throw new AuthCredentialsError();
  }

  return toPublicUser(user);
}

function cleanSignupInput(input) {
  return {
    name: String(input.name ?? "").trim(),
    email: String(input.email ?? "").trim().toLowerCase(),
    password: String(input.password ?? ""),
  };
}

function validateSignup(signup) {
  const errors = {};

  if (!signup.name) {
    errors.name = "Name is required.";
  } else if (signup.name.length > 100) {
    errors.name = "Name must be 100 characters or fewer.";
  }

  if (!EMAIL_PATTERN.test(signup.email) || signup.email.length > 254) {
    errors.email = "Enter a valid email address.";
  }

  const passwordBytes = Buffer.byteLength(signup.password, "utf8");
  if (signup.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  } else if (passwordBytes > 72) {
    errors.password = "Password must be 72 bytes or fewer.";
  }

  return errors;
}

function isAdminEmail(email, adminEmails = process.env.ADMIN_EMAILS ?? "") {
  const allowlist = Array.isArray(adminEmails)
    ? adminEmails
    : String(adminEmails).split(",");

  return allowlist
    .map((allowedEmail) => String(allowedEmail).trim().toLowerCase())
    .filter(Boolean)
    .includes(email);
}

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
