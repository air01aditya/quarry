const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const users = require("./users.repository");
const { jwtSecret, jwtExpiresIn } = require("../../config");
const { HttpError } = require("../../utils/httpError");

const SALT_ROUNDS = 10;
const UNIQUE_VIOLATION = "23505";

async function register({ email, password }) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  try {
    return await users.create(email, passwordHash);
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) {
      throw new HttpError(409, "email already registered");
    }
    throw err;
  }
}

async function login({ email, password }) {
  const user = await users.findByEmail(email);
  const passwordMatches = user && (await bcrypt.compare(password, user.passwordHash));
  if (!passwordMatches) {
    throw new HttpError(401, "invalid email or password");
  }

  const token = jwt.sign({ sub: String(user.id) }, jwtSecret, { expiresIn: jwtExpiresIn });
  return { token };
}

module.exports = { register, login };
