# Court Booking

Court Booking is a pickleball court reservation app for COMPSCI 326.

## Team Roster

| Name | GitHub Username |
| --- | --- |
| Grace Huang | `huang-grace05` |
| Samantha Jabak | `samanthajabak` |
| Vedant Naidu | `vizzycode` |

## Working Agreement

- We will use our group chat for day-to-day updates, quick questions, and deciding who is working on what.
- All project changes should happen on branches and go through pull requests before merging into `main`.
- A PR is done when it is focused, runs without obvious errors, and gets at least one teammate review.
- If we disagree on an approach, we will talk through the tradeoff, pick the simpler option that fits the sprint, and revisit it later if it becomes a problem.

## Project Domain

We want to build a pickleball court reservation app because public courts can get crowded and it is hard to tell when a court is actually available. The main action is that a player reserves a spot on a court for a time slot, either alone or with a party of up to four people. Each player can list a skill level from 1 to 5, so people can see the general level of a reserved group before requesting a spot. This fits Computing for the Common Good because it helps people use a shared community resource more fairly and makes it easier for newer players to find games that match their level.

## Running Locally

This project currently has an Express server with a home page, court information, player skill levels, and a reservation request feature.

1. Clone the repository:

   ```bash
   git clone https://github.com/huang-grace05/326-court-booking.git
   cd 326-court-booking
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the server:

   ```bash
   npm start
   ```

4. Open the app in a browser:

   ```text
   http://localhost:3000
   ```

Current routes:

- `GET /` shows the home page.
- `GET /courts` shows the first court-related page.
- `GET /players` shows player skill level descriptions.
- `GET /reservations` shows the reservation request form and saved reservations.
- `POST /reservations` saves a new reservation request after service-layer validation.

## Sprint 2 Feature: Reservation Requests

The first complete feature is requesting a pickleball court reservation. A user can go to `/reservations`, fill out the form with their name, court, date, time, party size, and skill level, and submit it from the browser. The form uses `fetch` to post to the server, the server validates the fields, saves the request in `reservations.json`, and the saved request appears in the current reservations list.

To exercise it:

1. Run the app with `npm start`.
2. Open `http://localhost:3000/reservations`.
3. Fill out every field in the reservation form.
4. Submit the form.
5. Confirm the new reservation appears under "Current reservations."
6. Refresh the page and confirm the reservation is still there.

If required fields are missing, the service returns a validation error and the page shows which fields need to be fixed.

## System Diagram

```text
Browser
  |
  | GET /reservations
  v
routes/reservationRoutes.js
  |
  v
controllers/reservationController.js
  |
  v
services/reservationService.js
  |
  v
repositories/reservationRepository.js
  |
  v
reservations.json

Browser form
  |
  | fetch POST /reservations
  v
routes/reservationRoutes.js
  |
  v
controllers/reservationController.js
  |
  | turns req.body into a service call
  v
services/reservationService.js
  |
  | validates required fields, party size, and skill level
  v
repositories/reservationRepository.js
  |
  | reads and writes the JSON file
  v
reservations.json
  |
  v
JSON response back to public/app.js
  |
  v
Rendered reservation appears on /reservations
```
