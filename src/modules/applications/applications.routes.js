const { Router } = require("express");
const requireAuth = require("../../middleware/requireAuth");
const service = require("./applications.service");
const { notFound } = require("../../utils/httpError");
const {
  createSchema,
  updateSchema,
  statusSchema,
  listQuerySchema,
  noteSchema,
} = require("./applications.schema");

const MAX_INT = 2147483647;

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1 || id > MAX_INT) {
    throw notFound("application");
  }
  return id;
}

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  res.json(await service.list(req.userId, listQuerySchema.parse(req.query)));
});

router.post("/", async (req, res) => {
  const application = await service.create(req.userId, createSchema.parse(req.body));
  res.status(201).json(application);
});

router.get("/:id", async (req, res) => {
  res.json(await service.getById(req.userId, parseId(req.params.id)));
});

router.patch("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  res.json(await service.update(req.userId, id, updateSchema.parse(req.body)));
});

router.patch("/:id/status", async (req, res) => {
  const id = parseId(req.params.id);
  const { status } = statusSchema.parse(req.body);
  res.json(await service.changeStatus(req.userId, id, status));
});

router.delete("/:id", async (req, res) => {
  await service.remove(req.userId, parseId(req.params.id));
  res.status(204).end();
});

router.post("/:id/notes", async (req, res) => {
  const id = parseId(req.params.id);
  const { body } = noteSchema.parse(req.body);
  res.status(201).json(await service.addNote(req.userId, id, body));
});

module.exports = router;
