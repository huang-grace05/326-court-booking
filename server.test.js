import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import app from "./app.js";

test("POST /reservations saves a valid reservation and renders it on the page", async (t) => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "court-booking-"));
  const reservationsFile = path.join(tempDir, "reservations.json");
  process.env.RESERVATIONS_FILE = reservationsFile;

  const server = app.listen(0);
  await once(server, "listening");
  t.after(async () => {
    await closeServer(server);
    delete process.env.RESERVATIONS_FILE;
    await rm(tempDir, { force: true, recursive: true });
  });

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(`${baseUrl}/reservations`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      playerName: "Vedant Naidu",
      courtName: "North Court",
      reservationDate: "2026-07-26",
      reservationTime: "10:00",
      partySize: "2",
      skillLevel: "3",
    }),
  });

  assert.equal(response.status, 201);

  const body = await response.json();
  assert.equal(body.message, "Reservation request saved.");
  assert.equal(body.reservation.playerName, "Vedant Naidu");
  assert.equal(body.reservation.partySize, 2);

  const savedReservations = JSON.parse(await readFile(reservationsFile, "utf8"));
  assert.equal(savedReservations.length, 1);
  assert.equal(savedReservations[0].courtName, "North Court");

  const pageResponse = await fetch(`${baseUrl}/reservations`);
  const pageHtml = await pageResponse.text();

  assert.equal(pageResponse.status, 200);
  assert.match(pageHtml, /Vedant Naidu/);
  assert.match(pageHtml, /North Court/);
});

test("POST /reservations returns validation errors without saving bad input", async (t) => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "court-booking-"));
  const reservationsFile = path.join(tempDir, "reservations.json");
  await writeFile(reservationsFile, "[]\n");
  process.env.RESERVATIONS_FILE = reservationsFile;

  const server = app.listen(0);
  await once(server, "listening");
  t.after(async () => {
    await closeServer(server);
    delete process.env.RESERVATIONS_FILE;
    await rm(tempDir, { force: true, recursive: true });
  });

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(`${baseUrl}/reservations`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      playerName: "",
      courtName: "",
      reservationDate: "",
      reservationTime: "",
      partySize: "",
      skillLevel: "",
    }),
  });

  assert.equal(response.status, 400);

  const body = await response.json();
  assert.equal(body.message, "Please fill out the required reservation fields.");
  assert.equal(body.errors.playerName, "Name is required.");
  assert.equal(body.errors.courtName, "Court is required.");
  assert.equal(body.errors.reservationDate, "Date is required.");
  assert.equal(body.errors.reservationTime, "Time is required.");
  assert.equal(body.errors.partySize, "Party size is required.");
  assert.equal(body.errors.skillLevel, "Skill level is required.");

  const savedReservations = JSON.parse(await readFile(reservationsFile, "utf8"));
  assert.deepEqual(savedReservations, []);
});

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}
