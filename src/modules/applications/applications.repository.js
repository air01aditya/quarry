const { pool } = require("../../db/pool");

const COLUMNS = `
  id, company, role, job_url AS "jobUrl", source, status,
  applied_on AS "appliedOn", created_at AS "createdAt", updated_at AS "updatedAt"
`;

// API field -> column. Only these can be changed through update().
const EDITABLE_COLUMNS = {
  company: "company",
  role: "role",
  jobUrl: "job_url",
  source: "source",
  appliedOn: "applied_on",
};

async function create(userId, input, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO applications (user_id, company, role, job_url, source, status, applied_on)
     VALUES ($1, $2, $3, $4, $5, $6::text,
             COALESCE($7::date, CASE WHEN $6::text = 'applied' THEN CURRENT_DATE END))
     RETURNING ${COLUMNS}`,
    [
      userId,
      input.company,
      input.role,
      input.jobUrl ?? null,
      input.source ?? null,
      input.status,
      input.appliedOn ?? null,
    ],
  );
  return rows[0];
}

async function findById(userId, id) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM applications WHERE user_id = $1 AND id = $2`,
    [userId, id],
  );
  return rows[0] || null;
}

// Locks the row until the transaction ends, so two status changes on the
// same application can't interleave.
async function findByIdForUpdate(userId, id, db) {
  const { rows } = await db.query(
    `SELECT ${COLUMNS} FROM applications WHERE user_id = $1 AND id = $2 FOR UPDATE`,
    [userId, id],
  );
  return rows[0] || null;
}

async function list(userId, { status, company, from, to, limit, offset }) {
  const values = [userId];
  const conditions = ["user_id = $1"];

  function addCondition(sql, value) {
    values.push(value);
    conditions.push(sql.replace("?", `$${values.length}`));
  }

  if (status) addCondition("status = ?", status);
  if (company) addCondition("company ILIKE ?", `%${company}%`);
  if (from) addCondition("applied_on >= ?", from);
  if (to) addCondition("applied_on <= ?", to);

  values.push(limit, offset);
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM applications
     WHERE ${conditions.join(" AND ")}
     ORDER BY applied_on DESC NULLS LAST, id DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
  );
  return rows;
}

async function update(userId, id, changes) {
  const values = [];
  const assignments = [];

  for (const [field, column] of Object.entries(EDITABLE_COLUMNS)) {
    if (changes[field] !== undefined) {
      values.push(changes[field]);
      assignments.push(`${column} = $${values.length}`);
    }
  }

  values.push(userId, id);
  const { rows } = await pool.query(
    `UPDATE applications
     SET ${assignments.join(", ")}, updated_at = now()
     WHERE user_id = $${values.length - 1} AND id = $${values.length}
     RETURNING ${COLUMNS}`,
    values,
  );
  return rows[0] || null;
}

async function updateStatus(id, status, db) {
  const { rows } = await db.query(
    `UPDATE applications
     SET status = $2::text,
         applied_on = CASE
           WHEN $2::text = 'applied' AND applied_on IS NULL THEN CURRENT_DATE
           ELSE applied_on
         END,
         updated_at = now()
     WHERE id = $1
     RETURNING ${COLUMNS}`,
    [id, status],
  );
  return rows[0];
}

async function remove(userId, id) {
  const { rowCount } = await pool.query(
    "DELETE FROM applications WHERE user_id = $1 AND id = $2",
    [userId, id],
  );
  return rowCount > 0;
}

async function addStatusEvent(applicationId, fromStatus, toStatus, db) {
  await db.query(
    `INSERT INTO status_events (application_id, from_status, to_status)
     VALUES ($1, $2, $3)`,
    [applicationId, fromStatus, toStatus],
  );
}

async function listStatusEvents(applicationId) {
  const { rows } = await pool.query(
    `SELECT from_status AS "from", to_status AS "to", changed_at AS "changedAt"
     FROM status_events
     WHERE application_id = $1
     ORDER BY changed_at, id`,
    [applicationId],
  );
  return rows;
}

module.exports = {
  create,
  findById,
  findByIdForUpdate,
  list,
  update,
  updateStatus,
  remove,
  addStatusEvent,
  listStatusEvents,
};
