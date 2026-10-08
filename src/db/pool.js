const { Pool, types } = require("pg");

// Keep DATE columns as "YYYY-MM-DD" strings. Converting them to JS Dates
// shifts them by the timezone offset.
const DATE_OID = 1082;
types.setTypeParser(DATE_OID, (value) => value);

// Connection settings come from the PG* environment variables.
const pool = new Pool();

async function withTransaction(work) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, withTransaction };
