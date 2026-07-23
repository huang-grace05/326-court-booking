export function showHomePage(req, res) {
  res.send(`
    <h1>Court Booking</h1>
    <p>A simple pickleball court reservation app for our COMPSCI 326 project.</p>
    <p>Players can request a court spot for a party of 1 to 4 people.</p>
    <p><a href="/courts">View court slots</a></p>
    <p><a href="/reservations">Request a reservation</a></p>
    <p><a href="/players">View player skill levels</a></p>
  `);
}

export function showCourtsPage(req, res) {
  res.send(`
    <h1>Pickleball Court Slots</h1>
    <p>This page shows the court options players can request.</p>
    <ul>
      <li>North Court</li>
      <li>South Court</li>
      <li>Community Center Court</li>
    </ul>
    <p><a href="/reservations">Request a reservation</a></p>
  `);
}

export function showPlayersPage(req, res) {
  res.send(`
    <h1>Player Skill Levels</h1>
    <p>Players can list a skill level from 1 to 5 so it is easier to find a good match.</p>
    <ul>
      <li>1-2: New to pickleball</li>
      <li>3: Comfortable with the basics</li>
      <li>4-5: Experienced player</li>
    </ul>
    <p><a href="/">Back home</a></p>
  `);
}
