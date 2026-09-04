import "dotenv/config";

export const config = {
  port: process.env.PORT || 4200,
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgres://roxier:roxier@localhost:5436/store_ratings",
  databaseSsl: process.env.DATABASE_SSL === "true",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-do-not-use-in-production",
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5180",
};
