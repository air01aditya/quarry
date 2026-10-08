const { ZodError } = require("zod");
const { HttpError } = require("../utils/httpError");

// Express only treats a middleware as an error handler if it takes 4 arguments.
function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "validation failed",
      details: err.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "invalid JSON" });
  }

  console.error(err);
  res.status(500).json({ error: "internal server error" });
}

module.exports = errorHandler;
