import express from "express";
import cors from "cors";
import { config } from "./config.js";
import authRoutes from "./routes/auth.js";
import storeRoutes from "./routes/stores.js";
import adminRoutes from "./routes/admin.js";
import ownerRoutes from "./routes/owner.js";

const app = express();

app.use(cors({ origin: config.frontendOrigin }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/owner", ownerRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// Anything a route throws lands here so the client always gets JSON back.
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: "Something went wrong on the server." });
});

app.listen(config.port, () => {
  console.log(`Backend listening on http://localhost:${config.port}`);
});
