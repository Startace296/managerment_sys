import "reflect-metadata";
import app from "./app";
import { AppDataSource } from "./config/database";
import { env } from "./config/env";

const bootstrap = async () => {
  try {
    await AppDataSource.initialize();
    console.log("Database connected successfully");

    app.listen(env.PORT, () => {
      console.log(`Server running on http://localhost:${env.PORT}`);
      console.log(`Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

bootstrap();
