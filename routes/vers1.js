const express = require('express');
const router = express.Router();
const EphemerisCntlr = require('../controllers/ephemeris');

router.post('/ephemeris', async (req, res) => {
  try {
    console.log('✅ /ephemeris route called');
    const result = await EphemerisCntlr.compute(req.body);

    res.status(200).json({
      statusCode: 200,
      message: 'Ephemeris computed successfully',
      ...result // inclui ephemerides, signos e query direto
    });
  } catch (error) {
    console.error('❌ Error in /ephemeris route:', error);

    res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
      error: error.message
    });
  }
});

module.exports = router;
