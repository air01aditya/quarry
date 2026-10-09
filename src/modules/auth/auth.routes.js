const { Router } = require("express");
const authService = require("./auth.service");
const { registerSchema, loginSchema } = require("./auth.schema");

const router = Router();

router.post("/register", async (req, res) => {
  const user = await authService.register(registerSchema.parse(req.body));
  res.status(201).json(user);
});

router.post("/login", async (req, res) => {
  const result = await authService.login(loginSchema.parse(req.body));
  res.json(result);
});

module.exports = router;
