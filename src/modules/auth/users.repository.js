const { pool } = require("../../db/pool");

async function create(email, passwordHash) {
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     RETURNING id, email, created_at AS "createdAt"`,
    [email, passwordHash],
  );
  return rows[0];
}

async function findByEmail(email) {
  const { rows } = await pool.query(
    `SELECT id, email, password_hash AS "passwordHash"
     FROM users
     WHERE email = $1`,
    [email],
  );
  return rows[0] || null;
}

module.exports = { create, findByEmail };
