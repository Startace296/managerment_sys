import "reflect-metadata";
import express from "express";
import cors from "cors";
import routes from "./routes";
import { errorHandler, notFound } from "./middlewares/error.middleware";
import { ensureDatabaseConnection } from "./config/database";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Vercel deploys this file as a serverless function (no long-running
// bootstrap like server.ts), so the DB connection is established lazily
// on the first request and reused on subsequent warm invocations.
app.use(async (_req, _res, next) => {
  try {
    await ensureDatabaseConnection();
    next();
  } catch (error) {
    next(error);
  }
});

app.use("/api/v1", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
