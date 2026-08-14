export function showHomePage(req, res) {
  res.render("home", { currentUser: req.session.user });
}

export function showCourtsPage(req, res) {
  res.render("courts", { currentUser: req.session.user });
}

export function showPlayersPage(req, res) {
  res.render("players", { currentUser: req.session.user });
}
