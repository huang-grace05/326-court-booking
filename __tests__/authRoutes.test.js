import { jest } from "@jest/globals";
import request from "supertest";

const mockAuthenticateUser = jest.fn();
const mockRegisterUser = jest.fn();
const mockListReservations = jest.fn();
const mockRequestReservation = jest.fn();
const mockRemoveReservation = jest.fn();

class MockAuthValidationError extends Error {
  constructor(errors) {
    super("Please fix the account details below.");
    this.errors = errors;
  }
}

class MockAuthCredentialsError extends Error {}

class MockReservationValidationError extends Error {}

class MockReservationAuthorizationError extends Error {
  constructor() {
    super("You can only cancel your own reservations.");
  }
}

jest.unstable_mockModule("../services/authService.js", () => ({
  authenticateUser: mockAuthenticateUser,
  registerUser: mockRegisterUser,
  AuthCredentialsError: MockAuthCredentialsError,
  AuthValidationError: MockAuthValidationError,
}));

jest.unstable_mockModule("../services/reservationService.js", () => ({
  listReservations: mockListReservations,
  requestReservation: mockRequestReservation,
  removeReservation: mockRemoveReservation,
  ReservationAuthorizationError: MockReservationAuthorizationError,
  ReservationValidationError: MockReservationValidationError,
}));

const { default: app } = await import("../app.js");

beforeEach(() => {
  jest.clearAllMocks();
  mockListReservations.mockResolvedValue([]);
});

test("renders labeled signup fields without a client-controlled role field", async () => {
  const response = await request(app).get("/signup").expect(200);

  expect(response.text).toContain('<label for="name"');
  expect(response.text).toContain('<label for="email"');
  expect(response.text).toContain('<label for="password"');
  expect(response.text).not.toContain('name="role"');
});

test("sets security headers without blocking the existing HTMX script", async () => {
  const response = await request(app).get("/signup").expect(200);

  expect(response.headers["content-security-policy"]).toContain(
    "script-src 'self' https://unpkg.com",
  );
  expect(response.headers["x-content-type-options"]).toBe("nosniff");
  expect(response.headers).not.toHaveProperty("x-powered-by");
});

test("makes signup and login discoverable from the public home page", async () => {
  const response = await request(app).get("/").expect(200);

  expect(response.text).toContain('href="/signup"');
  expect(response.text).toContain('href="/login"');
});

test("logs in with a signed httpOnly same-site session cookie", async () => {
  mockAuthenticateUser.mockResolvedValue({
    id: "user-1",
    name: "Vedant Naidu",
    email: "vedant@example.com",
    role: "member",
  });

  const response = await request(app)
    .post("/login")
    .type("form")
    .send({ email: "vedant@example.com", password: "court-pass-123" })
    .expect(303);

  expect(response.headers.location).toBe("/reservations");
  expect(response.headers["set-cookie"][0]).toMatch(/courtBooking\.sid=/);
  expect(response.headers["set-cookie"][0]).toMatch(/HttpOnly/);
  expect(response.headers["set-cookie"][0]).toMatch(/SameSite=Lax/);
});

test("protects reservation routes with the login gate", async () => {
  const response = await request(app).get("/reservations").expect(303);

  expect(response.headers.location).toBe("/login");
});

test("returns 403 when the service rejects a non-owner cancellation", async () => {
  mockAuthenticateUser.mockResolvedValue({
    id: "user-1",
    name: "Vedant Naidu",
    email: "vedant@example.com",
    role: "member",
  });
  mockRemoveReservation.mockRejectedValue(
    new MockReservationAuthorizationError(),
  );
  const agent = request.agent(app);

  await agent
    .post("/login")
    .type("form")
    .send({ email: "vedant@example.com", password: "court-pass-123" })
    .expect(303);

  const response = await agent
    .delete("/reservations/reservation-2")
    .set("Accept", "application/json")
    .expect(403);

  expect(response.body).toEqual({
    message: "You can only cancel your own reservations.",
  });
});
