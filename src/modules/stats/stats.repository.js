const { pool } = require("../../db/pool");
const { RESPONSE_STATUSES } = require("../applications/statuses");

// "Reached" uses the status history, not the current status, so an
// application that went interview -> rejected still counts as an interview.
async function getSummary(userId) {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE a.applied_on IS NOT NULL)::int AS applied,
       COUNT(*) FILTER (WHERE a.applied_on >= date_trunc('week', CURRENT_DATE))::int AS "appliedThisWeek",
       COUNT(*) FILTER (WHERE EXISTS (
         SELECT 1 FROM status_events e
         WHERE e.application_id = a.id AND e.to_status = ANY($2)
       ))::int AS responded
     FROM applications a
     WHERE a.user_id = $1`,
    [userId, RESPONSE_STATUSES],
  );
  return rows[0];
}

async function countByStatus(userId) {
  const { rows } = await pool.query(
    `SELECT status, COUNT(*)::int AS count
     FROM applications
     WHERE user_id = $1
     GROUP BY status`,
    [userId],
  );
  return rows;
}

async function countBySource(userId) {
  const { rows } = await pool.query(
    `SELECT
       COALESCE(a.source, 'unknown') AS source,
       COUNT(*)::int AS applications,
       COUNT(*) FILTER (WHERE EXISTS (
         SELECT 1 FROM status_events e
         WHERE e.application_id = a.id AND e.to_status = 'interview'
       ))::int AS interviews
     FROM applications a
     WHERE a.user_id = $1
     GROUP BY 1
     ORDER BY applications DESC, source`,
    [userId],
  );
  return rows;
}

module.exports = { getSummary, countByStatus, countBySource };
