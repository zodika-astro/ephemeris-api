'use strict';
const express = require('express');
const router = express.Router();
const EphemerisCntlr = require('../controllers/ephemeris'); // Import controller

// Route for ephemeris calculations
router.post('/ephemeris', async (req, res) => {
  console.log('Ephemeris route called');

  try {
    // CHAME A FUNÇÃO 'compute' DO SEU CONTROLADOR
    const result = await EphemerisCntlr.compute(req.body);

    // Send the response back
    res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Ephemeris route error:', error.message);
    res.status(500).json({
      statusCode: 500,
      message: `Calculation failed: ${error.message}`
    });
  }
});

module.exports = router;
