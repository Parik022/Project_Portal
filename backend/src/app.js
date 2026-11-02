require("dotenv").config({ quiet: true });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const swaggerUi = require("swagger-ui-express");
const { env } = require("./config/env");
const routes = require("./routes");
const openapi = require("./docs/openapi");
const { notFound, errorHandler } = require("./middleware/error.middleware");

const app = express();

// Render and similar hosts sit behind a proxy; needed for correct client IPs in rate limiting.
app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    // CLIENT_URL may hold several comma-separated origins (e.g. production + preview URLs).
    origin: env.CLIENT_URL.split(",").map((origin) => origin.trim()),
    credentials: true,
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => res.redirect("/api/docs"));
app.get("/api/docs.json", (req, res) => res.json(openapi));
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: "ProjectFlow API" }));

// /api/v1 is the versioned path; /api is kept so existing clients keep working.
app.use("/api/v1", routes);
app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
