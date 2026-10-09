const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { app, request, pool, resetDatabase } = require("./helpers");

describe("auth", () => {
  const credentials = { email: "Me@Example.com", password: "long-enough-password" };

  before(resetDatabase);
  after(() => pool.end());

  it("registers a user and stores the email in lowercase", async () => {
    const res = await request(app).post("/auth/register").send(credentials).expect(201);
    assert.equal(res.body.email, "me@example.com");
    assert.equal(res.body.passwordHash, undefined);
  });

  it("rejects a duplicate email", async () => {
    await request(app).post("/auth/register").send(credentials).expect(409);
  });

  it("rejects a short password", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "other@example.com", password: "short" })
      .expect(400);
    assert.equal(res.body.details[0].field, "password");
  });

  it("logs in and returns a token", async () => {
    const res = await request(app).post("/auth/login").send(credentials).expect(200);
    assert.ok(res.body.token);
  });

  it("rejects a wrong password", async () => {
    await request(app)
      .post("/auth/login")
      .send({ ...credentials, password: "wrong-password" })
      .expect(401);
  });

  it("answers malformed JSON with 400", async () => {
    const res = await request(app)
      .post("/auth/login")
      .set("Content-Type", "application/json")
      .send("{bad json")
      .expect(400);
    assert.equal(res.body.error, "invalid JSON");
  });
});
