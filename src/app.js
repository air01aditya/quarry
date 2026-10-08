const express = require("express");
const authRoutes = require("./modules/auth/auth.routes");
const applicationRoutes = require("./modules/applications/applications.routes");
const errorHandler = require("./middleware/errorHandler");

function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/auth", authRoutes);
  app.use("/applications", applicationRoutes);

  app.use((req, res) => {
    res.status(404).json({ error: "not found" });
  });
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
