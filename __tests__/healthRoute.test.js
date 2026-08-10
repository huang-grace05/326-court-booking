import request from "supertest";
import app from "../app.js";

describe("GET /health", () => {
  test("returns a public JSON health status", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.body).toEqual({ status: "ok" });
  });
});