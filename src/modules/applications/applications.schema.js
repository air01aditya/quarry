const { z } = require("zod");
const { STATUSES } = require("./statuses");

const fields = {
  company: z.string().trim().min(1).max(200),
  role: z.string().trim().min(1).max(200),
  jobUrl: z.url().max(2000).nullish(),
  source: z.string().trim().min(1).max(50).nullish(),
  appliedOn: z.iso.date().nullish(),
};

const createSchema = z.object({
  ...fields,
  status: z.enum(STATUSES).default("saved"),
});

// Status is left out on purpose: it only changes through PATCH /:id/status,
// so every change ends up in the history.
const updateSchema = z
  .strictObject(fields)
  .partial()
  .refine((input) => Object.keys(input).length > 0, { message: "nothing to update" });

const statusSchema = z.object({
  status: z.enum(STATUSES),
});

const listQuerySchema = z.object({
  status: z.enum(STATUSES).optional(),
  company: z.string().trim().min(1).optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const noteSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

module.exports = { createSchema, updateSchema, statusSchema, listQuerySchema, noteSchema };
