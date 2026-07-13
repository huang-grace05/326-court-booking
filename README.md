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

This project currently has a small Express server with a home page and a court slots page.

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
