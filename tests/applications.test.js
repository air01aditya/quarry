const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { pool, resetDatabase, createUser, api } = require("./helpers");

describe("applications", () => {
  let me;
  let someoneElse;

  before(async () => {
    await resetDatabase();
    me = api((await createUser()).token);
    someoneElse = api((await createUser()).token);
  });

  after(() => pool.end());

  it("creates an application with status 'saved' by default", async () => {
    const res = await me
      .post("/applications", { company: "Acme", role: "Backend Developer" })
      .expect(201);

    assert.equal(res.body.company, "Acme");
    assert.equal(res.body.status, "saved");
    assert.equal(res.body.appliedOn, null);
  });

  it("fills appliedOn when created as 'applied'", async () => {
    const res = await me
      .post("/applications", { company: "Globex", role: "SDE 1", status: "applied" })
      .expect(201);
    assert.match(res.body.appliedOn, /^\d{4}-\d{2}-\d{2}$/);
  });

  it("keeps an explicit appliedOn date as-is", async () => {
    const res = await me
      .post("/applications", {
        company: "Initech",
        role: "Backend Intern",
        status: "applied",
        appliedOn: "2026-09-01",
      })
      .expect(201);
    assert.equal(res.body.appliedOn, "2026-09-01");
  });

  it("rejects missing fields with details", async () => {
    const res = await me.post("/applications", { company: "Acme" }).expect(400);
    assert.deepEqual(
      res.body.details.map((d) => d.field),
      ["role"],
    );
  });

  it("rejects an impossible date", async () => {
    await me
      .post("/applications", { company: "Acme", role: "SDE", appliedOn: "2026-02-30" })
      .expect(400);
  });

  it("lists only my applications, filtered by status", async () => {
    const all = await me.get("/applications").expect(200);
    assert.equal(all.body.items.length, 3);

    const applied = await me.get("/applications?status=applied").expect(200);
    assert.equal(applied.body.items.length, 2);
    assert.ok(applied.body.items.every((a) => a.status === "applied"));

    const theirs = await someoneElse.get("/applications").expect(200);
    assert.equal(theirs.body.items.length, 0);
  });

  it("filters by company name, case-insensitively", async () => {
    const res = await me.get("/applications?company=glob").expect(200);
    assert.deepEqual(
      res.body.items.map((a) => a.company),
      ["Globex"],
    );
  });

  it("changes status and records the history", async () => {
    const created = await me.post("/applications", { company: "Hooli", role: "SDE" }).expect(201);
    const id = created.body.id;

    const applied = await me.patch(`/applications/${id}/status`, { status: "applied" }).expect(200);
    assert.equal(applied.body.status, "applied");
    assert.ok(applied.body.appliedOn);

    await me.patch(`/applications/${id}/status`, { status: "interview" }).expect(200);

    const detail = await me.get(`/applications/${id}`).expect(200);
    assert.deepEqual(
      detail.body.history.map((h) => [h.from, h.to]),
      [
        [null, "saved"],
        ["saved", "applied"],
        ["applied", "interview"],
      ],
    );
  });

  it("refuses to set the same status twice", async () => {
    const created = await me.post("/applications", { company: "Umbrella", role: "SDE" });
    await me.patch(`/applications/${created.body.id}/status`, { status: "saved" }).expect(409);
  });

  it("updates editable fields but not status", async () => {
    const created = await me.post("/applications", { company: "Stark", role: "SDE" });
    const id = created.body.id;

    const res = await me
      .patch(`/applications/${id}`, { role: "Backend Engineer", source: "referral" })
      .expect(200);
    assert.equal(res.body.role, "Backend Engineer");
    assert.equal(res.body.source, "referral");

    await me.patch(`/applications/${id}`, { status: "offer" }).expect(400);
  });

  it("adds notes and returns them with the application", async () => {
    const created = await me.post("/applications", { company: "Wayne", role: "SDE" });
    const id = created.body.id;

    await me.post(`/applications/${id}/notes`, { body: "HR call on Monday" }).expect(201);

    const detail = await me.get(`/applications/${id}`).expect(200);
    assert.deepEqual(
      detail.body.notes.map((n) => n.body),
      ["HR call on Monday"],
    );
  });

  it("hides other users' applications behind a 404", async () => {
    const created = await me.post("/applications", { company: "Private", role: "SDE" });
    const id = created.body.id;

    await someoneElse.get(`/applications/${id}`).expect(404);
    await someoneElse.patch(`/applications/${id}`, { role: "x" }).expect(404);
    await someoneElse.patch(`/applications/${id}/status`, { status: "offer" }).expect(404);
    await someoneElse.delete(`/applications/${id}`).expect(404);
  });

  it("deletes an application", async () => {
    const created = await me.post("/applications", { company: "Temp", role: "SDE" });
    const id = created.body.id;

    await me.delete(`/applications/${id}`).expect(204);
    await me.get(`/applications/${id}`).expect(404);
  });

  it("treats a non-numeric id as not found", async () => {
    await me.get("/applications/abc").expect(404);
  });
});
