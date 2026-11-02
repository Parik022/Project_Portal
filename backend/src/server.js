const app = require("./app");
const { env } = require("./config/env");
const { prisma } = require("./config/database");

const start = async () => {
  try {
    await prisma.$connect();
  } catch (error) {
    console.error("Could not connect to the database:", error.message);
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    console.log(`ProjectFlow API running on port ${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled promise rejection:", reason);
  });
};

start();
