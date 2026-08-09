import bcrypt from "bcrypt";
import { jest } from "@jest/globals";

const mockFindUserByEmail = jest.fn();
const mockCreateUser = jest.fn();

jest.unstable_mockModule("../repositories/usersRepository.js", () => ({
  findUserByEmail: mockFindUserByEmail,
  createUser: mockCreateUser,
}));

const {
  authenticateUser,
  registerUser,
  AuthCredentialsError,
  AuthValidationError,
} = await import("../services/authService.js");

const signupInput = {
  name: "Vedant Naidu",
  email: "vedant@example.com",
  password: "court-pass-123",
};

beforeEach(() => {
  jest.clearAllMocks();
});

test("registers a member with a bcrypt hash and never trusts a submitted role", async () => {
  mockFindUserByEmail.mockResolvedValue(null);
  mockCreateUser.mockImplementation(async (user) => ({ id: "user-1", ...user }));

  const user = await registerUser({ ...signupInput, role: "admin" });
  const savedUser = mockCreateUser.mock.calls[0][0];

  expect(savedUser).toMatchObject({
    name: "Vedant Naidu",
    email: "vedant@example.com",
    role: "member",
  });
  expect(savedUser).not.toHaveProperty("password");
  expect(savedUser.passwordHash).not.toBe(signupInput.password);
  await expect(
    bcrypt.compare(signupInput.password, savedUser.passwordHash),
  ).resolves.toBe(true);
  expect(user).toEqual({
    id: "user-1",
    name: "Vedant Naidu",
    email: "vedant@example.com",
    role: "member",
  });
  expect(user).not.toHaveProperty("passwordHash");
});

test("assigns admin only when the email is on the server-side allowlist", async () => {
  mockFindUserByEmail.mockResolvedValue(null);
  mockCreateUser.mockImplementation(async (user) => ({ id: "admin-1", ...user }));

  const user = await registerUser(
    { ...signupInput, email: "ADMIN@example.com", role: "member" },
    { adminEmails: "admin@example.com" },
  );

  expect(mockCreateUser).toHaveBeenCalledWith(
    expect.objectContaining({ email: "admin@example.com", role: "admin" }),
  );
  expect(user.role).toBe("admin");
});

test("rejects a duplicate email before hashing or creating another user", async () => {
  mockFindUserByEmail.mockResolvedValue({ id: "existing-user" });

  await expect(registerUser(signupInput)).rejects.toMatchObject({
    name: "AuthValidationError",
    errors: { email: "An account with this email already exists." },
  });
  expect(mockCreateUser).not.toHaveBeenCalled();
});

test("validates signup fields before writing to the repository", async () => {
  await expect(
    registerUser({ name: "", email: "bad-email", password: "short" }),
  ).rejects.toBeInstanceOf(AuthValidationError);
  expect(mockFindUserByEmail).not.toHaveBeenCalled();
  expect(mockCreateUser).not.toHaveBeenCalled();
});

test("authenticates a valid password without exposing its hash", async () => {
  const passwordHash = await bcrypt.hash(signupInput.password, 12);
  mockFindUserByEmail.mockResolvedValue({
    id: "user-1",
    name: signupInput.name,
    email: signupInput.email,
    passwordHash,
    role: "member",
  });

  await expect(
    authenticateUser({
      email: "  VEDANT@example.com ",
      password: signupInput.password,
    }),
  ).resolves.toEqual({
    id: "user-1",
    name: signupInput.name,
    email: signupInput.email,
    role: "member",
  });
});

test("uses the same generic error for an unknown email and a bad password", async () => {
  mockFindUserByEmail.mockResolvedValue(null);
  await expect(
    authenticateUser({ email: "missing@example.com", password: "wrong-pass" }),
  ).rejects.toBeInstanceOf(AuthCredentialsError);

  mockFindUserByEmail.mockResolvedValue({
    passwordHash: await bcrypt.hash("right-pass", 12),
  });
  await expect(
    authenticateUser({ email: "vedant@example.com", password: "wrong-pass" }),
  ).rejects.toMatchObject({ message: "Email or password is incorrect." });
});
