import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    playerName: { type: String, required: true, trim: true },
    courtName: { type: String, required: true, trim: true },
    reservationDate: { type: String, required: true },
    reservationTime: { type: String, required: true },
    partySize: { type: Number, required: true, min: 1, max: 4 },
    skillLevel: { type: Number, required: true, min: 1, max: 5 },
    status: {
      type: String,
      enum: ["requested", "confirmed", "cancelled"],
      default: "requested",
    },
  },
  { timestamps: true },
);

const Reservation =
  mongoose.models.Reservation ||
  mongoose.model("Reservation", reservationSchema);

export async function getAll() {
  const reservations = await Reservation.find().sort({ createdAt: -1 }).lean();
  return reservations.map(toClientReservation);
}

export async function findById(id) {
  if (!mongoose.isValidObjectId(id)) {
    return null;
  }

  const reservation = await Reservation.findById(id).lean();
  return reservation ? toClientReservation(reservation) : null;
}

export async function create(reservation) {
  const savedReservation = await Reservation.create(reservation);
  return toClientReservation(savedReservation.toObject());
}

export async function updateById(id, updates) {
  if (!mongoose.isValidObjectId(id)) {
    return null;
  }

  const reservation = await Reservation.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).lean();

  return reservation ? toClientReservation(reservation) : null;
}

export async function removeById(id) {
  if (!mongoose.isValidObjectId(id)) {
    return false;
  }

  const reservation = await Reservation.findByIdAndDelete(id);
  return reservation !== null;
}

// These names keep the service layer unchanged while the repository moves to
// the per-record CRUD interface used by MongoDB.
export const getReservations = getAll;
export const addReservation = create;
export const deleteReservation = removeById;

function toClientReservation(reservation) {
  const { _id, __v, ...fields } = reservation;
  return { id: _id.toString(), ...fields };
}
