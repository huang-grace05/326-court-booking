import {
  listReservations,
  requestReservation,
  ReservationValidationError,
} from "../services/reservationService.js";

const emptyForm = {
  playerName: "",
  courtName: "",
  reservationDate: "",
  reservationTime: "",
  partySize: "",
  skillLevel: "",
};

export async function showReservationsPage(req, res) {
  const reservations = await listReservations();

  res.render("reservations", {
    reservations,
    error: null,
    errors: {},
    formData: emptyForm,
  });
}

export async function createReservation(req, res, next) {
  try {
    const reservation = await requestReservation(req.body);
    const reservations = await listReservations();

    if (wantsJson(req)) {
      return res.status(201).json({
        message: "Reservation request saved.",
        reservation,
        reservations,
      });
    }

    return res.status(201).render("reservations", {
      reservations,
      error: null,
      errors: {},
      formData: emptyForm,
    });
  } catch (error) {
    if (error instanceof ReservationValidationError) {
      if (wantsJson(req)) {
        return res.status(400).json({
          message: error.message,
          errors: error.errors,
        });
      }

      const reservations = await listReservations();

      return res.status(400).render("reservations", {
        reservations,
        error: error.message,
        errors: error.errors,
        formData: { ...emptyForm, ...req.body },
      });
    }

    return next(error);
  }
}

function wantsJson(req) {
  return req.is("application/json") || req.accepts(["json", "html"]) === "json";
}
