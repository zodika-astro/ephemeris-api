const express = require('express');
const router = express.Router();
const EphemerisCntlr = require('../controllers/ephemeris');

router.post('/ephemeris', EphemerisCntlr.compute);

module.exports = router;

