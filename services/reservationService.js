import { randomUUID } from "node:crypto";

import {
  addReservation,
  getReservations,
} from "../repositories/reservationRepository.js";

export class ReservationValidationError extends Error {
  constructor(errors) {
    super("Please fill out the required reservation fields.");
    this.name = "ReservationValidationError";
    this.errors = errors;
  }
}

export async function listReservations() {
  return getReservations();
}

export async function requestReservation(input) {
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
    status: "requested",
    createdAt: new Date().toISOString(),
  };

  return addReservation(reservation);
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
  }

  if (!input.courtName) {
    errors.courtName = "Court is required.";
  }

  if (!input.reservationDate) {
    errors.reservationDate = "Date is required.";
  }

  if (!input.reservationTime) {
    errors.reservationTime = "Time is required.";
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
