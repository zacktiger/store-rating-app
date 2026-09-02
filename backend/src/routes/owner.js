import { Router } from "express";
import { query } from "../db.js";
import { requireLogin, requireRole } from "../middleware/auth.js";
import { buildOrderBy } from "../sorting.js";

const router = Router();

const SORTABLE_COLUMNS = {
  name: "u.name",
  email: "u.email",
  score: "r.score",
  ratedAt: "r.updated_at",
};

// The store owner's dashboard: their store, its average, and everyone who rated it.
router.get("/dashboard", requireLogin, requireRole("owner"), async (req, res, next) => {
  try {
    const { sortBy, sortDir } = req.query;

    const storeResult = await query(
      `SELECT s.id,
              s.name,
              s.address,
              ROUND(AVG(r.score), 2) AS average_rating,
              COUNT(r.id)            AS rating_count
       FROM stores s
       LEFT JOIN ratings r ON r.store_id = s.id
       WHERE s.owner_id = $1
       GROUP BY s.id`,
      [req.user.id]
    );

    const store = storeResult.rows[0];
    if (!store) {
      // An owner account exists but no store points at it yet.
      return res.json({ store: null, ratings: [] });
    }

    const orderBy = buildOrderBy(SORTABLE_COLUMNS, sortBy, sortDir);
    const ratingsResult = await query(
      `SELECT u.name, u.email, u.address, r.score, r.updated_at
       FROM ratings r
       JOIN users u ON u.id = r.user_id
       WHERE r.store_id = $1
       ${orderBy}`,
      [store.id]
    );

    res.json({
      store: {
        id: store.id,
        name: store.name,
        address: store.address,
        averageRating: store.average_rating,
        ratingCount: Number(store.rating_count),
      },
      ratings: ratingsResult.rows.map((row) => ({
        name: row.name,
        email: row.email,
        address: row.address,
        score: row.score,
        ratedAt: row.updated_at,
      })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
