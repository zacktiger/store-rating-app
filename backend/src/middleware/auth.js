import jwt from "jsonwebtoken";
import { config } from "../config.js";

const TOKEN_LIFETIME = "8h";

export function createToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    config.jwtSecret,
    { expiresIn: TOKEN_LIFETIME }
  );
}

// Rejects the request unless it carries a valid token. On success it puts the
// signed-in user on `req.user` so route handlers can read req.user.id / .role.
export function requireLogin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "You need to log in first." });
  }

  try {
    req.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    return res.status(401).json({ message: "Your session has expired. Log in again." });
  }
}

// Use after requireLogin, e.g. router.get("/", requireLogin, requireRole("admin"), ...)
export function requireRole(...allowedRoles) {
  return function (req, res, next) {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have access to this." });
    }
    next();
  };
}
