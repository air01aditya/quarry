const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config");
const { HttpError } = require("../utils/httpError");

function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new HttpError(401, "missing or malformed token");
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    req.userId = Number(payload.sub);
  } catch {
    throw new HttpError(401, "invalid or expired token");
  }

  next();
}

module.exports = requireAuth;
