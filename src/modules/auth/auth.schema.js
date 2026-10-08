const { z } = require("zod");

const email = z.string().trim().toLowerCase().pipe(z.email());

const registerSchema = z.object({
  email,
  // bcrypt only uses the first 72 bytes of a password.
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  email,
  password: z.string().min(1),
});

module.exports = { registerSchema, loginSchema };
