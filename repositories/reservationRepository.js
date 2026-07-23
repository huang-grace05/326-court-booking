import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const defaultReservationsFile = fileURLToPath(
  new URL("../reservations.json", import.meta.url),
);

export async function getReservations() {
  return readReservations();
}

export async function addReservation(reservation) {
  const reservations = await readReservations();
  const updatedReservations = [reservation, ...reservations];

  await writeReservations(updatedReservations);

  return reservation;
}

async function readReservations() {
  try {
    const fileContents = await readFile(getReservationsFilePath(), "utf8");
    const reservations = JSON.parse(fileContents);

    return Array.isArray(reservations) ? reservations : [];
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function writeReservations(reservations) {
  const filePath = getReservationsFilePath();

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(reservations, null, 2)}\n`);
}

function getReservationsFilePath() {
  return process.env.RESERVATIONS_FILE || defaultReservationsFile;
}
