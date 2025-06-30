const express = require('express');
const router = express.Router();

/**
 * Healthcheck endpoint to confirm API is up and running
 */
router.get('/', function (req, res) {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

module.exports = router;
