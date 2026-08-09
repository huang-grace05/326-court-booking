export function requireLogin(req, res, next) {
  if (req.session?.user) {
    return next();
  }

  return res.redirect(303, "/login");
}
