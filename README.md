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

3. Copy the environment template and replace the session secret with a random value:

   ```bash
   cp .env.example .env
   openssl rand -hex 32
   ```

   Put the generated value in `SESSION_SECRET`. `MONGODB_URI` can keep the local default if MongoDB is running on your computer. The committed `change-me` value is intentionally too short for production and must never be used as a real secret.

4. Start MongoDB. If you dont have Docker set up follow https://docs.docker.com/get-started/get-docker/

Skip this step if MongoDB is already running locally on port 27017
```bash
   docker run -d -p 27017:27017 --name local-mongo mongo:8
```

5. Start the server:

```bash
   npm start
```
6. Open the app in a browser:

   ```text
   http://localhost:3000
   ```
### Seeding

There is no seed script for this project. Courts and skill-level descriptions are static content within the app, reservations are only created by registered users using the `/reservations` form, and there is no initial data to load. The only exception is admin accounts, which are made without seeding using `npm run admin:create` (see the Sprint 4 Authentication and Authorization section below).


Current routes:

- `GET /` shows the home page.
- `GET /courts` shows the first court-related page.
- `GET /players` shows player skill level descriptions.
- `GET /signup` and `POST /signup` create an account.
- `GET /login` and `POST /login` start a signed session.
- `POST /logout` ends the current session.
- `GET /reservations` shows the reservation request form and saved reservations after login.
- `GET /health` returns `{ "status": "ok" }` without requiring authentication.
- `POST /reservations` saves a new reservation owned by the logged-in user.
- `DELETE /reservations/:id` lets the reservation owner or an admin cancel it. It returns `403` for a logged-in non-owner and `404` when the reservation does not exist.


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

## Sprint 3 Changes

### MongoDB repository

Reservations now persist in MongoDB through Mongoose instead of `reservations.json`. The repository has `getAll`, `findById`, `create`, `updateById`, and `removeById` operations. The existing route, controller, and service flow stays the same.

To see it, start MongoDB, run `npm start`, and use `GET /reservations`, `POST /reservations`, or `DELETE /reservations/:id`. The records are stored in the `reservations` collection in the `court-booking` database.

MongoDB now supplies the client-facing reservation id. The EJS view and browser JavaScript already read `reservation.id`, so the repository converts Mongoose's `_id` to that same property. This is the one id exception from the file repository: ids are real MongoDB object ids now instead of UUIDs stored in the JSON file.

### Automated tests

The Jest suites cover reservation validation, authentication, route protection, and owner/admin authorization with mocked repositories and an in-memory test session store. A separate Playwright smoke test uses real Chromium, MongoDB persistence, and Mongo-backed sessions to exercise member signup, login/logout, reservation ownership, a non-owner `403`, and a server-provisioned admin deletion.

Run the fast suite with:

```bash
npm test
```

With MongoDB running, install Chromium once and run the full browser flow with:

```bash
npx playwright install chromium
npm run test:e2e
```

The browser test only clears test data from the dedicated `court-booking-e2e` database and refuses to clear data from a database whose name does not end in `-e2e`. GitHub Actions repeats the syntax check, Jest suite, MongoDB-backed browser test, and dependency audit for every pull request into `main` and every push to `main`.

### HTMX cancellation

Canceling a reservation no longer reloads the page. Each Cancel button uses `hx-delete`, `hx-target`, and `hx-swap`, and the server returns an empty HTML response that removes only that reservation row. A missing id returns `404` instead of pretending the delete worked.

To see it, open `http://localhost:3000/reservations`, create a reservation, and click Cancel. The confirmation appears and the row disappears without a full reload.

## Sprint 4 Authentication and Authorization

### Session authentication

Signup and login use `bcrypt` password hashes with 12 salt rounds. Plain-text passwords are never written to MongoDB or copied into the session. `express-session` signs an HTTP-only, same-site cookie, while `connect-mongo` stores the session itself in MongoDB. Production cookies are also marked secure.

Every account created through the public signup form becomes a `member`. The form has no role field, and an email address alone can never grant admin access. Admin accounts are created separately with the server-side `npm run admin:create` command, so elevated access cannot be claimed through public signup.

To try both roles:

1. Open `/signup` and create a normal member.
2. In a separate terminal, set `ADMIN_NAME` and `ADMIN_EMAIL`, then read a password without echoing it and run the one-time provisioning command:

   ```bash
   export ADMIN_NAME="Court Admin"
   export ADMIN_EMAIL="admin@example.com"
   read -s ADMIN_PASSWORD
   export ADMIN_PASSWORD
   npm run admin:create
   unset ADMIN_PASSWORD
   ```

3. Use `/login` to switch between the member and the provisioned admin. The reservation header shows the active name and role.

### Reservation authorization

Reservation routes use `requireLogin` for the first question: is anyone logged in? Cancellation uses the service layer for the resource-aware question. `removeReservation` loads the record first, then its `isOwnerOrAdmin` check compares the reservation's `ownerId` with the session user or allows the `admin` role. A logged-in member trying to cancel someone else's reservation receives `403 Forbidden`; a missing reservation still receives `404 Not Found`.

To verify the rule, create a reservation as one member, log in as a different member, and try its Cancel button. The reservation stays in place and the response is `403`. Log in as the owner or admin and the same cancellation succeeds.

### Accessibility Audit

The application was reviewed using a manual WCAG AA contrast check and a keyboard-only walkthrough. Three problems were fixed:

- The "Save reservation request" button and the header hover states used a green that measured 3.77:1 with white text, below the 4.5:1 requirement. Both now use a darker color that passes.
- Canceling a reservation removes the focused button and its row. After cancellation, keyboard focus now moves to the "Current reservations" heading.
- Signup and login error messages were not connected to their fields. This was fixed by adding `aria-describedby` and `role="alert"`. Each field also has a valid `<label>`.

To verify these changes, navigate through the reservation and authentication forms using only the keyboard. Cancel a reservation and confirm that focus moves to the "Current reservations" heading. Then submit the signup form with an invalid email and confirm that the error is announced.

### Health Check

`GET /health` is a public health check that deployment platforms and monitoring tools can use to verify that the server is running. It does not require login or a session.

To test it:

```bash
curl 'http://localhost:3000/health'
```

## System Diagram

```text
Browser
  |
  +-- GET/POST /signup or /login
  |     |
  |     v
  |   routes/authRoutes.js (rate-limited account writes)
  |     |
  |     v
  |   controllers/authController.js
  |     |
  |     +-- services/authService.js
  |     |     | bcrypt hash/compare and member-only public signup
  |     |     v
  |     |   repositories/usersRepository.js
  |     |     v
  |     |   User model -> MongoDB users collection
  |     |
  |     +-- express-session signed cookie
  |           v
  |         connect-mongo -> MongoDB sessions collection
  |
  +-- npm run admin:create
  |     | server-only admin provisioning (no public route)
  |     v
  |   services/authService.js -> users repository -> User model
  |
  +-- GET/POST/DELETE /reservations
        |
        v
      routes/reservationRoutes.js
        | requireLogin: is a user logged in?
        v
      controllers/reservationController.js
        |
        v
      services/reservationService.js
        | validates reservation input
        | loads the requested reservation
        | isOwnerOrAdmin: may this user cancel this record?
        v
      repositories/reservationRepository.js
        | Mongoose per-record CRUD with ownerId
        v
      Reservation model -> MongoDB reservations collection

Jest service, middleware, and route tests
  |
  +-- auth hashing, public user output, and server-assigned roles
  +-- requireLogin redirect and signed session cookie
  +-- owner success, admin success, non-owner 403, and missing record 404
  v
Mock repositories / in-memory test session store (no MongoDB connection)

Playwright browser smoke test -> real Chromium -> MongoDB E2E database
```
