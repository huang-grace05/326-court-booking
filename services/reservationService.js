import { randomUUID } from "node:crypto";
import {
  addReservation,
  getReservations,
  getReservationById,
  deleteReservation,
} from "../repositories/reservationRepository.js";

const COURT_NAMES = new Set([
  "North Court",
  "South Court",
  "Community Center Court",
]);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export class ReservationValidationError extends Error {
  constructor(errors) {
    super("Please fill out the required reservation fields.");
    this.name = "ReservationValidationError";
    this.errors = errors;
  }
}

export class ReservationAuthorizationError extends Error {
  constructor() {
    super("You can only cancel your own reservations.");
    this.name = "ReservationAuthorizationError";
    this.statusCode = 403;
  }
}

export async function listReservations() {
  return getReservations();
}

export async function requestReservation(input, currentUser) {
  const cleaned = cleanReservationInput(input);
  const errors = validateReservation(cleaned);

  if (Object.keys(errors).length > 0) {
    throw new ReservationValidationError(errors);
  }

  const reservation = {
    id: randomUUID(),
    playerName: cleaned.playerName,
    courtName: cleaned.courtName,
    reservationDate: cleaned.reservationDate,
    reservationTime: cleaned.reservationTime,
    partySize: Number(cleaned.partySize),
    skillLevel: Number(cleaned.skillLevel),
    ownerId: currentUser.id,
    status: "requested",
    createdAt: new Date().toISOString(),
  };

  return addReservation(reservation);
}

export async function removeReservation(id, currentUser) {
  const reservation = await getReservationById(id);

  if (!reservation) {
    return false;
  }

  if (!isOwnerOrAdmin(reservation, currentUser)) {
    throw new ReservationAuthorizationError();
  }

  return deleteReservation(id);
}

function isOwnerOrAdmin(reservation, currentUser) {
  return (
    currentUser?.role === "admin" || reservation.ownerId === currentUser?.id
  );
}

function cleanReservationInput(input = {}) {
  return {
    playerName: String(input.playerName ?? "").trim(),
    courtName: String(input.courtName ?? "").trim(),
    reservationDate: String(input.reservationDate ?? "").trim(),
    reservationTime: String(input.reservationTime ?? "").trim(),
    partySize: String(input.partySize ?? "").trim(),
    skillLevel: String(input.skillLevel ?? "").trim(),
  };
}

function validateReservation(input) {
  const errors = {};

  if (!input.playerName) {
    errors.playerName = "Name is required.";
  } else if (input.playerName.length > 100) {
    errors.playerName = "Name must be 100 characters or fewer.";
  }

  if (!input.courtName) {
    errors.courtName = "Court is required.";
  } else if (!COURT_NAMES.has(input.courtName)) {
    errors.courtName = "Choose one of the listed courts.";
  }

  if (!input.reservationDate) {
    errors.reservationDate = "Date is required.";
  } else if (!isValidDate(input.reservationDate)) {
    errors.reservationDate = "Enter a valid date.";
  }

  if (!input.reservationTime) {
    errors.reservationTime = "Time is required.";
  } else if (!TIME_PATTERN.test(input.reservationTime)) {
    errors.reservationTime = "Enter a valid time.";
  }

  if (!input.partySize) {
    errors.partySize = "Party size is required.";
  } else {
    const partySize = Number(input.partySize);
    if (!Number.isInteger(partySize) || partySize < 1 || partySize > 4) {
      errors.partySize = "Party size must be from 1 to 4.";
    }
  }

  if (!input.skillLevel) {
    errors.skillLevel = "Skill level is required.";
  } else {
    const skillLevel = Number(input.skillLevel);
    if (!Number.isInteger(skillLevel) || skillLevel < 1 || skillLevel > 5) {
      errors.skillLevel = "Skill level must be from 1 to 5.";
    }
  }

  return errors;
}

function isValidDate(value) {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
