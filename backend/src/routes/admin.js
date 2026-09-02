import { Router } from "express";
import bcrypt from "bcryptjs";
import { query } from "../db.js";
import { requireLogin, requireRole } from "../middleware/auth.js";
import { buildOrderBy } from "../sorting.js";
import {
  checkAddress,
  checkEmail,
  checkName,
  checkPassword,
  checkRole,
  firstError,
} from "../validation.js";

const router = Router();

// Everything in this file is admin-only.
router.use(requireLogin, requireRole("admin"));

const USER_COLUMNS = {
  name: "u.name",
  email: "u.email",
  address: "u.address",
  role: "u.role",
};

const STORE_COLUMNS = {
  name: "s.name",
  email: "s.email",
  address: "s.address",
  rating: "AVG(r.score)",
};

// The three totals on the admin dashboard.
router.get("/dashboard", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT (SELECT COUNT(*) FROM users)   AS total_users,
              (SELECT COUNT(*) FROM stores)  AS total_stores,
              (SELECT COUNT(*) FROM ratings) AS total_ratings`
    );
    const totals = result.rows[0];

    res.json({
      totalUsers: Number(totals.total_users),
      totalStores: Number(totals.total_stores),
      totalRatings: Number(totals.total_ratings),
    });
  } catch (error) {
    next(error);
  }
});

// User list with filters on name, email, address and role.
router.get("/users", async (req, res, next) => {
  try {
    const { name = "", email = "", address = "", role = "", sortBy, sortDir } = req.query;

    const orderBy = buildOrderBy(USER_COLUMNS, sortBy, sortDir);
    const result = await query(
      `SELECT u.id, u.name, u.email, u.address, u.role
       FROM users u
       WHERE u.name ILIKE $1
         AND u.email ILIKE $2
         AND u.address ILIKE $3
         AND ($4 = '' OR u.role = $4)
       ${orderBy}`,
      [`%${name}%`, `%${email}%`, `%${address}%`, role]
    );

    res.json({ users: result.rows });
  } catch (error) {
    next(error);
  }
});

// A single user. If they own a store, send that store's average rating too.
router.get("/users/:userId", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.address, u.role,
              s.name AS store_name,
              ROUND(AVG(r.score), 2) AS store_rating
       FROM users u
       LEFT JOIN stores s  ON s.owner_id = u.id
       LEFT JOIN ratings r ON r.store_id = s.id
       WHERE u.id = $1
       GROUP BY u.id, s.name`,
      [Number(req.params.userId)]
    );

    const row = result.rows[0];
    if (!row) return res.status(404).json({ message: "User not found." });

    res.json({
      user: {
        id: row.id,
        name: row.name,
        email: row.email,
        address: row.address,
        role: row.role,
        storeName: row.store_name,
        storeRating: row.store_rating,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Admins create users of any role, including other admins and store owners.
router.post("/users", async (req, res, next) => {
  try {
    const { name, email, address, password, role } = req.body;

    const problem = firstError({
      name: checkName(name),
      email: checkEmail(email),
      address: checkAddress(address),
      password: checkPassword(password),
      role: checkRole(role),
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
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, address, role`,
      [name.trim(), email.trim().toLowerCase(), passwordHash, address.trim(), role]
    );

    res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Store list with its average rating, filterable and sortable.
router.get("/stores", async (req, res, next) => {
  try {
    const { name = "", email = "", address = "", sortBy, sortDir } = req.query;

    const orderBy = buildOrderBy(STORE_COLUMNS, sortBy, sortDir);
    const result = await query(
      `SELECT s.id, s.name, s.email, s.address,
              ROUND(AVG(r.score), 2) AS rating,
              COUNT(r.id)            AS rating_count,
              o.name                 AS owner_name
       FROM stores s
       LEFT JOIN ratings r ON r.store_id = s.id
       LEFT JOIN users o   ON o.id = s.owner_id
       WHERE s.name ILIKE $1 AND s.email ILIKE $2 AND s.address ILIKE $3
       GROUP BY s.id, o.name
       ${orderBy}`,
      [`%${name}%`, `%${email}%`, `%${address}%`]
    );

    res.json({
      stores: result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        address: row.address,
        rating: row.rating,
        ratingCount: Number(row.rating_count),
        ownerName: row.owner_name,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Owner accounts an admin can attach to a new store.
router.get("/owners", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.email
       FROM users u
       WHERE u.role = 'owner'
       ORDER BY u.name`
    );
    res.json({ owners: result.rows });
  } catch (error) {
    next(error);
  }
});

router.post("/stores", async (req, res, next) => {
  try {
    const { name, email, address, ownerId } = req.body;

    const problem = firstError({
      name: checkName(name),
      email: checkEmail(email),
      address: checkAddress(address),
    });
    if (problem) return res.status(400).json(problem);

    const emailTaken = await query("SELECT id FROM stores WHERE email = $1", [
      email.trim().toLowerCase(),
    ]);
    if (emailTaken.rows.length > 0) {
      return res
        .status(409)
        .json({ field: "email", message: "A store with that email already exists." });
    }

    // Picking an owner is optional, but if one is given it has to be a real
    // owner account that does not already have a store.
    if (ownerId) {
      const owner = await query(
        "SELECT id FROM users WHERE id = $1 AND role = 'owner'",
        [Number(ownerId)]
      );
      if (owner.rows.length === 0) {
        return res
          .status(400)
          .json({ field: "ownerId", message: "Pick a valid store owner account." });
      }

      const alreadyOwns = await query("SELECT id FROM stores WHERE owner_id = $1", [
        Number(ownerId),
      ]);
      if (alreadyOwns.rows.length > 0) {
        return res
          .status(409)
          .json({ field: "ownerId", message: "That owner already has a store." });
      }
    }

    const result = await query(
      `INSERT INTO stores (name, email, address, owner_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, address, owner_id`,
      [
        name.trim(),
        email.trim().toLowerCase(),
        address.trim(),
        ownerId ? Number(ownerId) : null,
      ]
    );

    res.status(201).json({ store: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

export default router;
