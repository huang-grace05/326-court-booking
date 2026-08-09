import { jest } from "@jest/globals";

const { requireLogin } = await import("../middleware/requireLogin.js");

test("allows an authenticated session to reach the protected route", () => {
  const req = { session: { user: { id: "user-1", role: "member" } } };
  const res = {};
  const next = jest.fn();

  requireLogin(req, res, next);

  expect(next).toHaveBeenCalledTimes(1);
});

test("redirects an unauthenticated browser request to login", () => {
  const req = { session: {}, originalUrl: "/reservations" };
  const res = { redirect: jest.fn() };
  const next = jest.fn();

  requireLogin(req, res, next);

  expect(res.redirect).toHaveBeenCalledWith(303, "/login");
  expect(next).not.toHaveBeenCalled();
});
