-- Dropping first keeps `npm run db:setup` repeatable while developing.
DROP TABLE IF EXISTS ratings;
DROP TABLE IF EXISTS stores;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(60) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  address       VARCHAR(400) NOT NULL,
  role          VARCHAR(10) NOT NULL CHECK (role IN ('admin', 'user', 'owner')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE stores (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(60) NOT NULL,
  email      VARCHAR(255) NOT NULL UNIQUE,
  address    VARCHAR(400) NOT NULL,
  -- The store owner is a user row with role 'owner'. Nullable so an admin can
  -- add a store before deciding who owns it.
  owner_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ratings (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_id   INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  score      SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- A user has at most one rating per store, so "change my rating" is an UPDATE.
  UNIQUE (user_id, store_id)
);

-- Ratings are almost always looked up by store (for the average) or by user
-- (to show "your rating" in the store list).
CREATE INDEX ratings_store_id_idx ON ratings(store_id);
CREATE INDEX ratings_user_id_idx ON ratings(user_id);
CREATE INDEX stores_owner_id_idx ON stores(owner_id);
