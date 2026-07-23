import express from "express";

const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.send(`
    <h1>Court Booking</h1>
    <p>A simple pickleball court reservation app for our COMPSCI 326 project.</p>
    <p>Players will be able to reserve a court spot for a party of 1 to 4 people.</p>
    <p><a href="/courts">View court slots</a></p>

    <p><a href="/reservations">View reservations</a></p>
  `);
});

app.get("/courts", (req, res) => {
  res.send(`
    <h1>Pickleball Court Slots</h1>
    <p>This page will eventually show open court times and let players request a spot.</p>
    <ul>
      <li>Party size can be 1, 2, 3, or 4 players.</li>
      <li>Players can share a skill level from 1 to 5.</li>
      <li>Managers will be able to review reservation requests later.</li>
    </ul>
  `);
});

app.get("/players", (req, res) => {
  res.send(`
    <h1>Player Skill Levels</h1>
    <p>Players can list a skill level from 1 to 5 so it's easier to find a good match.</p>
    <ul>
      <li>1-2: New to pickleball</li>
      <li>3: Comfortable with the basics</li>
      <li>4-5: Experienced player</li>
    </ul>
    <p><a href="/">Back home</a></p>
  `);
});

app.get("/reservations", (req, res) => {
  res.send(`
    <h1>Current Reservations</h1>
    <p>This page will eventually display upcoming pickleball court reservations.</p>
    <p>Players will be able to view the court, time slot, party size, and skill level.</p>
    <p><a href="/">Return to home</a></p>
  `);
});

app.listen(port, () => {
  console.log(`Court Booking server running at http://localhost:${port}`);
});
