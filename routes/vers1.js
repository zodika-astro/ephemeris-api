const express = require('express');
const router = express.Router();
const EphemerisCntlr = require('../controllers/ephemeris');

router.post('/ephemeris', async (req, res, next) => {
  try {
    console.log('✅ /ephemeris route called');
    const result = await EphemerisCntlr.compute(req.body); // ✅ Correção essencial aqui
    res.locals.status = 200;
    res.locals.message = 'Ephemeris computed successfully';
    res.locals.results = result;
    next();
  } catch (error) {
    console.error('❌ Error in /ephemeris route:', error);
    res.locals.status = 500;
    res.locals.message = 'Internal Server Error';
    res.locals.results = { error: error.message };
    next();
  }
});

module.exports = router;
