const { withTransaction } = require("../../db/pool");
const applications = require("./applications.repository");
const notes = require("./notes.repository");
const { HttpError, notFound } = require("../../utils/httpError");

async function create(userId, input) {
  return withTransaction(async (client) => {
    const application = await applications.create(userId, input, client);
    await applications.addStatusEvent(application.id, null, application.status, client);
    return application;
  });
}

async function list(userId, filters) {
  const items = await applications.list(userId, filters);
  return { items, limit: filters.limit, offset: filters.offset };
}

async function getById(userId, id) {
  const application = await applications.findById(userId, id);
  if (!application) throw notFound("application");

  const [history, applicationNotes] = await Promise.all([
    applications.listStatusEvents(id),
    notes.listByApplication(id),
  ]);
  return { ...application, history, notes: applicationNotes };
}

async function update(userId, id, changes) {
  const application = await applications.update(userId, id, changes);
  if (!application) throw notFound("application");
  return application;
}

// The status change and its history entry are written together or not at all.
async function changeStatus(userId, id, status) {
  return withTransaction(async (client) => {
    const current = await applications.findByIdForUpdate(userId, id, client);
    if (!current) throw notFound("application");
    if (current.status === status) {
      throw new HttpError(409, `application is already ${status}`);
    }

    const updated = await applications.updateStatus(id, status, client);
    await applications.addStatusEvent(id, current.status, status, client);
    return updated;
  });
}

async function remove(userId, id) {
  const deleted = await applications.remove(userId, id);
  if (!deleted) throw notFound("application");
}

async function addNote(userId, id, body) {
  const application = await applications.findById(userId, id);
  if (!application) throw notFound("application");
  return notes.create(id, body);
}

module.exports = { create, list, getById, update, changeStatus, remove, addNote };
