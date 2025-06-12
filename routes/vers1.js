const express = require('express');
const router = express.Router();
const EphemerisCntlr = require('../controllers/ephemeris');

router.post('/ephemeris', async function (req, res, next) {
  try {
    const result = await EphemerisCntlr.compute(req.body);
    res.locals.status = 200;
    res.locals.message = 'Ephemerides returned';
    res.locals.results = result;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = router;

