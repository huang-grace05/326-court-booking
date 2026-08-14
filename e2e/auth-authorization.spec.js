import { expect, test } from "@playwright/test";
import mongoose from "mongoose";

import { connectDatabase } from "../config/database.js";
import { provisionAdmin } from "../services/authService.js";

const mongoUri =
  process.env.E2E_MONGODB_URI ??
  "mongodb://127.0.0.1:27017/court-booking-e2e";
const admin = {
  name: "Court Admin",
  email: "admin@example.com",
  password: "admin-pass-123",
};

test.beforeAll(async () => {
  process.env.MONGODB_URI = mongoUri;
  await connectDatabase();
  await clearE2eData();
  await provisionAdmin(admin);
});

test.afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await clearE2eData();
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});

test("member ownership and server-provisioned admin work in a real browser", async ({
  context,
  page,
}) => {
  const consoleProblems = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      consoleProblems.push(`${message.type()}: ${message.text()}`);
    }
  });

  await page.goto("/signup");
  await page.getByLabel("Name").fill("Owner Member");
  await page.getByLabel("Email").fill("owner@example.com");
  await page.getByLabel("Password").fill("owner-pass-123");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/reservations$/);
  await expect(page.getByText("Owner Member · member")).toBeVisible();

  const sessionCookie = (await context.cookies()).find(
    (cookie) => cookie.name === "courtBooking.sid",
  );
  expect(sessionCookie).toMatchObject({
    httpOnly: true,
    sameSite: "Lax",
  });

  await page.getByLabel("Your name", { exact: true }).fill("Owner Member");
  await page.getByLabel("Court", { exact: true }).selectOption("North Court");
  await page.getByLabel("Date", { exact: true }).fill("2026-08-10");
  await page.getByLabel("Time", { exact: true }).fill("10:00");
  await page.getByLabel("Party size", { exact: true }).selectOption("2");
  await page.getByLabel("Skill level", { exact: true }).selectOption("3");
  await page.getByRole("button", { name: "Save reservation request" }).click();
  await expect(
    page.locator(".reservation-item").filter({ hasText: "Owner Member" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.locator(".reservation-item").filter({ hasText: "Owner Member" }),
  ).toHaveCount(1);

  await page.getByRole("button", { name: "Log out" }).click();
  await page.getByRole("link", { name: "Sign up" }).click();
  await page.getByLabel("Name").fill("Other Member");
  await page.getByLabel("Email").fill("other@example.com");
  await page.getByLabel("Password").fill("other-pass-123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Other Member · member")).toBeVisible();

  const otherMemberReservation = page
    .locator(".reservation-item")
    .filter({ hasText: "Owner Member" });
  await expect(
    otherMemberReservation.getByRole("button", { name: "Cancel" }),
  ).toHaveCount(0);
  const reservationId = await otherMemberReservation.getAttribute(
    "data-reservation-id",
  );
  const forbiddenResponse = await page.request.delete(
    `/reservations/${reservationId}`,
    { headers: { Accept: "application/json" } },
  );
  expect(forbiddenResponse.status()).toBe(403);
  expect(await forbiddenResponse.json()).toEqual({
    message: "You can only cancel your own reservations.",
  });
  await expect(otherMemberReservation).toBeVisible();

  await page.getByRole("button", { name: "Log out" }).click();
  await page.getByLabel("Email").fill(admin.email);
  await page.getByLabel("Password").fill(admin.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("Court Admin · admin")).toBeVisible();

  const adminReservation = page
    .locator(".reservation-item")
    .filter({ hasText: "Owner Member" });
  const deleteResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "DELETE" &&
      response.url().includes("/reservations/"),
  );
  page.once("dialog", (dialog) => dialog.accept());
  await adminReservation.getByRole("button", { name: "Cancel" }).click();
  expect((await deleteResponse).status()).toBe(200);
  await expect(adminReservation).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Current reservations" }),
  ).toBeFocused();

  expect(consoleProblems).toEqual([]);
});

function assertE2eDatabase() {
  const databaseName = mongoose.connection.db?.databaseName;
  if (!databaseName?.endsWith("-e2e")) {
    throw new Error(
      `Refusing to clear non-E2E database: ${databaseName ?? "unknown"}`,
    );
  }
}

async function clearE2eData() {
  assertE2eDatabase();
  await Promise.all(
    ["users", "reservations", "sessions"].map((collectionName) =>
      mongoose.connection.db.collection(collectionName).deleteMany({}),
    ),
  );
}
