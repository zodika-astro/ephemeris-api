const express = require('express');
const router = express.Router();
const EphemerisCntlr = require('../ephemeris/ephemerisCntlr');
const Validator = require('../ephemeris/validateInput');

router.get('/ephemeris', Validator.validate, EphemerisCntlr.get);

router.get('/planetNames', EphemerisCntlr.getPlanetNames);

module.exports = router;