const { pool } = require("../../db/pool");

const COLUMNS = `id, body, created_at AS "createdAt"`;

async function create(applicationId, body) {
  const { rows } = await pool.query(
    `INSERT INTO notes (application_id, body) VALUES ($1, $2) RETURNING ${COLUMNS}`,
    [applicationId, body],
  );
  return rows[0];
}

async function listByApplication(applicationId) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM notes WHERE application_id = $1 ORDER BY created_at, id`,
    [applicationId],
  );
  return rows;
}

module.exports = { create, listByApplication };
