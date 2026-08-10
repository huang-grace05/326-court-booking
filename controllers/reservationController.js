import {
  listReservations,
  requestReservation,
  removeReservation,
  ReservationAuthorizationError,
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
    const reservation = await requestReservation(req.body, req.session.user);
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

export async function cancelReservation(req, res, next) {
  try {
    const wasRemoved = await removeReservation(req.params.id, req.session.user);

    if (!wasRemoved) {
      if (wantsJson(req)) {
        return res.status(404).json({ message: "Reservation not found." });
      }
      return res.status(404).send("Reservation not found.");
    }

    return res.status(200).send("");
  } catch (error) {
    if (error instanceof ReservationAuthorizationError) {
      if (wantsJson(req)) {
        return res.status(403).json({ message: error.message });
      }
      return res.status(403).send(error.message);
    }

    return next(error);
  }
}

function wantsJson(req) {
  if (req.get("HX-Request") === "true") {
    return false;
  }
  return req.is("application/json") || req.accepts(["json", "html"]) === "json";
}
