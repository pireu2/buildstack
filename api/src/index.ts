import "reflect-metadata";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { AppDataSource } from "./data-source";
import routes from "./routes";
import { apiRateLimiter } from "./middlewares/rateLimiter";
import { errorHandler } from "./middlewares/errorHandler";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use(apiRateLimiter);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "core-api",
    db_connected: AppDataSource.isInitialized,
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/v1/core", routes);
app.use("/", routes);

app.use(errorHandler);

async function startServer() {
  try {
    if (process.env.DATABASE_URL) {
      await AppDataSource.initialize();
      console.log("[Database] Connected to PostgreSQL via TypeORM");
    } else {
      console.warn(
        "[Database] DATABASE_URL not set. Running without database connection.",
      );
    }

    app.listen(port, () => {
      console.log(`[Server] Core API Service listening on port ${port}`);
    });
  } catch (error) {
    console.error("[Database] Connection failed:", error);
    app.listen(port, () => {
      console.log(
        `[Server] Core API Service listening on port ${port} (database offline)`,
      );
    });
  }
}

startServer();
