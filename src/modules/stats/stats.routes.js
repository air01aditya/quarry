const { Router } = require("express");
const requireAuth = require("../../middleware/requireAuth");
const { getStats } = require("./stats.service");

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  res.json(await getStats(req.userId));
});

module.exports = router;
