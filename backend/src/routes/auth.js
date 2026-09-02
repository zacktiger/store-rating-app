import { Router } from "express";
import bcrypt from "bcryptjs";
import { query } from "../db.js";
import { createToken, requireLogin } from "../middleware/auth.js";
import {
  checkAddress,
  checkEmail,
  checkName,
  checkPassword,
  firstError,
} from "../validation.js";

const router = Router();

// Anyone signing up through the public form becomes a normal user. Admins and
// store owners are created by an admin from the admin screens.
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, address, password } = req.body;

    const problem = firstError({
      name: checkName(name),
      email: checkEmail(email),
      address: checkAddress(address),
      password: checkPassword(password),
    });
    if (problem) return res.status(400).json(problem);

    const emailTaken = await query("SELECT id FROM users WHERE email = $1", [
      email.trim().toLowerCase(),
    ]);
    if (emailTaken.rows.length > 0) {
      return res
        .status(409)
        .json({ field: "email", message: "That email is already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (name, email, password_hash, address, role)
       VALUES ($1, $2, $3, $4, 'user')
       RETURNING id, name, email, role`,
      [name.trim(), email.trim().toLowerCase(), passwordHash, address.trim()]
    );

    const user = result.rows[0];
    res.status(201).json({ token: createToken(user), user });
  } catch (error) {
    next(error);
  }
});

// One login for every role. The role in the response tells the frontend which
// screens to show.
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Enter your email and password." });
    }

    const result = await query(
      "SELECT id, name, email, role, password_hash FROM users WHERE email = $1",
      [email.trim().toLowerCase()]
    );
    const found = result.rows[0];

    // Same message either way, so nobody can use this to discover which emails
    // are registered.
    const passwordMatches =
      found && (await bcrypt.compare(password, found.password_hash));
    if (!passwordMatches) {
      return res.status(401).json({ message: "Email or password is incorrect." });
    }

    const user = {
      id: found.id,
      name: found.name,
      email: found.email,
      role: found.role,
    };
    res.json({ token: createToken(user), user });
  } catch (error) {
    next(error);
  }
});

// Every logged-in role can change their own password.
router.put("/password", requireLogin, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const problem = firstError({ newPassword: checkPassword(newPassword) });
    if (problem) return res.status(400).json(problem);

    const result = await query("SELECT password_hash FROM users WHERE id = $1", [
      req.user.id,
    ]);
    const currentMatches = await bcrypt.compare(
      currentPassword || "",
      result.rows[0].password_hash
    );
    if (!currentMatches) {
      return res.status(400).json({
        field: "currentPassword",
        message: "Your current password is not correct.",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      passwordHash,
      req.user.id,
    ]);

    res.json({ message: "Password updated." });
  } catch (error) {
    next(error);
  }
});

// Lets the frontend confirm a saved token is still valid on page refresh.
router.get("/me", requireLogin, async (req, res, next) => {
  try {
    const result = await query(
      "SELECT id, name, email, address, role FROM users WHERE id = $1",
      [req.user.id]
    );
    res.json({ user: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

export default router;
