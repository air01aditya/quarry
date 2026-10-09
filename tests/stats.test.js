const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { pool, resetDatabase, createUser, api } = require("./helpers");

describe("stats", () => {
  let me;

  before(async () => {
    await resetDatabase();
    me = api((await createUser()).token);

    const add = (body) => me.post("/applications", body).expect(201);
    const move = (id, status) => me.patch(`/applications/${id}/status`, { status }).expect(200);

    // 4 applied (2 via LinkedIn, 1 referral, 1 Naukri) and 1 only saved.
    const a = await add({ company: "A", role: "SDE", source: "linkedin", status: "applied" });
    const b = await add({ company: "B", role: "SDE", source: "linkedin", status: "applied" });
    const c = await add({ company: "C", role: "SDE", source: "referral", status: "applied" });
    await add({ company: "D", role: "SDE", source: "naukri", status: "applied" });
    await add({ company: "E", role: "SDE" });

    await move(a.body.id, "interview");
    await move(a.body.id, "rejected");
    await move(b.body.id, "ghosted");
    await move(c.body.id, "interview");
  });

  after(() => pool.end());

  it("summarises my applications", async () => {
    const { body } = await me.get("/stats").expect(200);

    assert.equal(body.total, 5);
    assert.equal(body.applied, 4);
    assert.equal(body.appliedThisWeek, 4);
    assert.equal(body.responded, 2);
    assert.equal(body.responseRate, 0.5);
  });

  it("counts by current status, including zeros", async () => {
    const { body } = await me.get("/stats").expect(200);
    assert.deepEqual(body.byStatus, {
      saved: 1,
      applied: 1,
      interview: 1,
      offer: 0,
      rejected: 1,
      ghosted: 1,
    });
  });

  it("counts interviews per source from the history", async () => {
    const { body } = await me.get("/stats").expect(200);
    assert.deepEqual(body.bySource, [
      { source: "linkedin", applications: 2, interviews: 1 },
      { source: "naukri", applications: 1, interviews: 0 },
      { source: "referral", applications: 1, interviews: 1 },
      { source: "unknown", applications: 1, interviews: 0 },
    ]);
  });
});
