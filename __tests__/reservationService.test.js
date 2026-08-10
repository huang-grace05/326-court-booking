import { jest } from "@jest/globals";

const mockGetReservations = jest.fn();
const mockGetReservationById = jest.fn();
const mockAddReservation = jest.fn();
const mockDeleteReservation = jest.fn();

jest.unstable_mockModule("../repositories/reservationRepository.js", () => ({
  getReservations: mockGetReservations,
  getReservationById: mockGetReservationById,
  addReservation: mockAddReservation,
  deleteReservation: mockDeleteReservation,
}));

const {
  listReservations,
  removeReservation,
  requestReservation,
  ReservationAuthorizationError,
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

const memberUser = {
  id: "user-1",
  role: "member",
};

beforeEach(() => {
  jest.clearAllMocks();
});

test("rejects every missing required field without writing to the repository", async () => {
  await expect(requestReservation({}, memberUser)).rejects.toMatchObject({
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
      requestReservation({ ...validReservation, partySize }, memberUser),
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
      requestReservation({ ...validReservation, skillLevel }, memberUser),
    ).rejects.toMatchObject({
      errors: { skillLevel: "Skill level must be from 1 to 5." },
    });

    expect(mockAddReservation).not.toHaveBeenCalled();
  },
);

test("cleans and converts valid input before creating a reservation", async () => {
  mockAddReservation.mockImplementation(async (reservation) => reservation);

  const result = await requestReservation(
    {
      ...validReservation,
      playerName: "  Vedant Naidu  ",
      partySize: "4",
      skillLevel: "5",
    },
    memberUser,
  );

  expect(result).toMatchObject({
    playerName: "Vedant Naidu",
    partySize: 4,
    skillLevel: 5,
    status: "requested",
    ownerId: "user-1",
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
  mockGetReservationById.mockResolvedValue({
    id: "reservation-1",
    ownerId: "user-1",
  });
  mockDeleteReservation.mockResolvedValue(true);

  await expect(
    removeReservation("reservation-1", memberUser),
  ).resolves.toBe(true);
  expect(mockGetReservationById).toHaveBeenCalledWith("reservation-1");
  expect(mockDeleteReservation).toHaveBeenCalledWith("reservation-1");
});

test("returns false when the reservation does not exist", async () => {
  mockGetReservationById.mockResolvedValue(null);

  await expect(
    removeReservation("missing-reservation", memberUser),
  ).resolves.toBe(false);
  expect(mockDeleteReservation).not.toHaveBeenCalled();
});

test("rejects a member canceling another user's reservation with a 403 error", async () => {
  mockGetReservationById.mockResolvedValue({
    id: "reservation-2",
    ownerId: "user-2",
  });

  await expect(
    removeReservation("reservation-2", memberUser),
  ).rejects.toMatchObject({
    name: "ReservationAuthorizationError",
    statusCode: 403,
  });
  expect(mockDeleteReservation).not.toHaveBeenCalled();
});

test("allows an admin to cancel another user's reservation", async () => {
  mockGetReservationById.mockResolvedValue({
    id: "reservation-2",
    ownerId: "user-2",
  });
  mockDeleteReservation.mockResolvedValue(true);

  await expect(
    removeReservation("reservation-2", { id: "admin-1", role: "admin" }),
  ).resolves.toBe(true);
  expect(mockDeleteReservation).toHaveBeenCalledWith("reservation-2");
});

test("exposes validation failures as ReservationValidationError values", async () => {
  await expect(requestReservation({}, memberUser)).rejects.toBeInstanceOf(
    ReservationValidationError,
  );
});
