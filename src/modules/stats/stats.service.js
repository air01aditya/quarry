const stats = require("./stats.repository");
const { STATUSES } = require("../applications/statuses");

async function getStats(userId) {
  const [summary, statusRows, bySource] = await Promise.all([
    stats.getSummary(userId),
    stats.countByStatus(userId),
    stats.countBySource(userId),
  ]);

  const byStatus = Object.fromEntries(STATUSES.map((status) => [status, 0]));
  for (const row of statusRows) {
    byStatus[row.status] = row.count;
  }

  const responseRate =
    summary.applied === 0 ? 0 : Math.round((summary.responded / summary.applied) * 100) / 100;

  return { ...summary, responseRate, byStatus, bySource };
}

module.exports = { getStats };
