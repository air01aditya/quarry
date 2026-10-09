// Tests always run against a separate database, never the real one.
process.env.PGDATABASE = process.env.PGDATABASE_TEST || "quarry_test";

const request = require("supertest");
const createApp = require("../src/app");
const migrate = require("../src/db/migrate");
const { pool } = require("../src/db/pool");

const app = createApp();

async function resetDatabase() {
  await migrate();
  await pool.query("TRUNCATE users RESTART IDENTITY CASCADE");
}

let userCount = 0;

async function createUser() {
  userCount += 1;
  const credentials = { email: `user${userCount}@example.com`, password: "long-enough-password" };
  await request(app).post("/auth/register").send(credentials).expect(201);
  const res = await request(app).post("/auth/login").send(credentials).expect(200);
  return { ...credentials, token: res.body.token };
}

function api(token) {
  const auth = (req) => req.set("Authorization", `Bearer ${token}`);
  return {
    get: (url) => auth(request(app).get(url)),
    post: (url, body) => auth(request(app).post(url)).send(body),
    patch: (url, body) => auth(request(app).patch(url)).send(body),
    delete: (url) => auth(request(app).delete(url)),
  };
}

module.exports = { app, request, pool, resetDatabase, createUser, api };
