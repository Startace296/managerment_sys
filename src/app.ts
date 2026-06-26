import express from "express";
import cors from "cors";
import routes from "./routes";
import { errorHandler, notFound } from "./middlewares/error.middleware";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
