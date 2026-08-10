import {
  authenticateUser,
  registerUser,
  AuthCredentialsError,
  AuthValidationError,
} from "../services/authService.js";

export function showSignupPage(req, res) {
  return renderAuthPage(res, {
    mode: "signup",
    error: null,
    errors: {},
    formData: { name: "", email: "" },
  });
}

export function showLoginPage(req, res) {
  return renderAuthPage(res, {
    mode: "login",
    error: null,
    errors: {},
    formData: { email: "" },
  });
}

export async function signup(req, res, next) {
  try {
    const user = await registerUser(req.body);
    await startUserSession(req, user);
    return res.redirect(303, "/reservations");
  } catch (error) {
    if (error instanceof AuthValidationError) {
      return res.status(400).render("auth", {
        mode: "signup",
        error: error.message,
        errors: error.errors,
        formData: {
          name: String(req.body.name ?? ""),
          email: String(req.body.email ?? ""),
        },
      });
    }

    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const user = await authenticateUser(req.body);
    await startUserSession(req, user);
    return res.redirect(303, "/reservations");
  } catch (error) {
    if (error instanceof AuthCredentialsError) {
      return res.status(401).render("auth", {
        mode: "login",
        error: error.message,
        errors: {},
        formData: { email: String(req.body.email ?? "") },
      });
    }

    return next(error);
  }
}

export async function logout(req, res, next) {
  try {
    await destroySession(req);
    res.clearCookie("courtBooking.sid");
    return res.redirect(303, "/login");
  } catch (error) {
    return next(error);
  }
}

function renderAuthPage(res, data) {
  return res.render("auth", data);
}

async function startUserSession(req, user) {
  await new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });

  req.session.user = user;

  await new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

function destroySession(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}
