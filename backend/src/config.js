import "dotenv/config";

export const config = {
  port: process.env.PORT || 4000,
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgres://roxier:roxier@localhost:5435/store_ratings",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-do-not-use-in-production",
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
};
