import { Router } from "express";
import { query } from "../db.js";
import { requireLogin, requireRole } from "../middleware/auth.js";
import { buildOrderBy } from "../sorting.js";
import { checkRating, firstError } from "../validation.js";

const router = Router();

const SORTABLE_COLUMNS = {
  name: "s.name",
  address: "s.address",
  overallRating: "AVG(r.score)",
  myRating: "MAX(CASE WHEN r.user_id = $1 THEN r.score END)",
};

// The store list a normal user browses. One query gives us the overall average
// and this user's own rating, so the page never has to ask again per store.
router.get("/", requireLogin, requireRole("user", "admin"), async (req, res, next) => {
  try {
    const { name = "", address = "", sortBy, sortDir } = req.query;

    const orderBy = buildOrderBy(SORTABLE_COLUMNS, sortBy, sortDir);
    const result = await query(
      `SELECT s.id,
              s.name,
              s.address,
              ROUND(AVG(r.score), 2) AS overall_rating,
              COUNT(r.id)            AS rating_count,
              MAX(CASE WHEN r.user_id = $1 THEN r.score END) AS my_rating
       FROM stores s
       LEFT JOIN ratings r ON r.store_id = s.id
       WHERE s.name ILIKE $2 AND s.address ILIKE $3
       GROUP BY s.id
       ${orderBy}`,
      [req.user.id, `%${name}%`, `%${address}%`]
    );

    res.json({
      stores: result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        address: row.address,
        overallRating: row.overall_rating,
        ratingCount: Number(row.rating_count),
        myRating: row.my_rating,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Submitting and changing a rating are the same action: there is one row per
// (user, store) pair, so we insert it or overwrite the score already there.
router.put("/:storeId/rating", requireLogin, requireRole("user"), async (req, res, next) => {
  try {
    const storeId = Number(req.params.storeId);
    const score = Number(req.body.score);

    const problem = firstError({ score: checkRating(score) });
    if (problem) return res.status(400).json(problem);

    const store = await query("SELECT id FROM stores WHERE id = $1", [storeId]);
    if (store.rows.length === 0) {
      return res.status(404).json({ message: "That store does not exist." });
    }

    const result = await query(
      `INSERT INTO ratings (user_id, store_id, score)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, store_id)
       DO UPDATE SET score = EXCLUDED.score, updated_at = now()
       RETURNING score`,
      [req.user.id, storeId, score]
    );

    res.json({ score: result.rows[0].score });
  } catch (error) {
    next(error);
  }
});

export default router;
