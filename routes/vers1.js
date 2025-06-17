'use strict';
const express = require('express');
const router = express.Router();
const EphemerisCntlr = require('../controllers/ephemeris'); // Import your controller

// Route for ephemeris calculations
router.post('/ephemeris', async (req, res) => {
  console.log('Ephemeris route called'); // Simplified log

  try {
    // Call the renamed function in your controller
    const result = await EphemerisCntlr.computeChart(req.body);

    // Send the response back
    res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Ephemeris route error:', error.message); // Simplified error log
    res.status(500).json({
      statusCode: 500,
      message: `Calculation failed: ${error.message}` // User-friendly error message
    });
  }
});

module.exports = router;
