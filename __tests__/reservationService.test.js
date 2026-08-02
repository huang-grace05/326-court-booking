import { jest } from "@jest/globals";

const mockGetReservations = jest.fn();
const mockAddReservation = jest.fn();
const mockDeleteReservation = jest.fn();

jest.unstable_mockModule("../repositories/reservationRepository.js", () => ({
  getReservations: mockGetReservations,
  addReservation: mockAddReservation,
  deleteReservation: mockDeleteReservation,
}));

const {
  listReservations,
  removeReservation,
  requestReservation,
  ReservationValidationError,
} = await import("../services/reservationService.js");

const validReservation = {
  playerName: "Vedant Naidu",
  courtName: "North Court",
  reservationDate: "2026-08-05",
  reservationTime: "10:00",
  partySize: "2",
  skillLevel: "3",
};

beforeEach(() => {
  jest.clearAllMocks();
});

test("rejects every missing required field without writing to the repository", async () => {
  await expect(requestReservation({})).rejects.toMatchObject({
    name: "ReservationValidationError",
    errors: {
      playerName: "Name is required.",
      courtName: "Court is required.",
      reservationDate: "Date is required.",
      reservationTime: "Time is required.",
      partySize: "Party size is required.",
      skillLevel: "Skill level is required.",
    },
  });

  expect(mockAddReservation).not.toHaveBeenCalled();
});

test.each(["0", "5", "2.5", "not-a-number"])(
  "rejects invalid party size %s",
  async (partySize) => {
    await expect(
      requestReservation({ ...validReservation, partySize }),
    ).rejects.toMatchObject({
      errors: { partySize: "Party size must be from 1 to 4." },
    });

    expect(mockAddReservation).not.toHaveBeenCalled();
  },
);

test.each(["0", "6", "3.5", "not-a-number"])(
  "rejects invalid skill level %s",
  async (skillLevel) => {
    await expect(
      requestReservation({ ...validReservation, skillLevel }),
    ).rejects.toMatchObject({
      errors: { skillLevel: "Skill level must be from 1 to 5." },
    });

    expect(mockAddReservation).not.toHaveBeenCalled();
  },
);

test("cleans and converts valid input before creating a reservation", async () => {
  mockAddReservation.mockImplementation(async (reservation) => reservation);

  const result = await requestReservation({
    ...validReservation,
    playerName: "  Vedant Naidu  ",
    partySize: "4",
    skillLevel: "5",
  });

  expect(result).toMatchObject({
    playerName: "Vedant Naidu",
    partySize: 4,
    skillLevel: 5,
    status: "requested",
  });
  expect(result.id).toEqual(expect.any(String));
  expect(result.createdAt).toEqual(expect.any(String));
  expect(mockAddReservation).toHaveBeenCalledTimes(1);
});

test("lists reservations through the repository", async () => {
  const reservations = [{ id: "reservation-1" }];
  mockGetReservations.mockResolvedValue(reservations);

  await expect(listReservations()).resolves.toBe(reservations);
});

test("returns whether the repository removed the reservation", async () => {
  mockDeleteReservation.mockResolvedValue(true);

  await expect(removeReservation("reservation-1")).resolves.toBe(true);
  expect(mockDeleteReservation).toHaveBeenCalledWith("reservation-1");
});

test("exposes validation failures as ReservationValidationError values", async () => {
  await expect(requestReservation({})).rejects.toBeInstanceOf(
    ReservationValidationError,
  );
});
