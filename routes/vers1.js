'use strict';
// Log when the ephemeris version 1 route file is entered.
console.log('Entered ephemeris route (routes/vers1.js)');

const express = require('express');
const router = express.Router();
const EphemerisController = require('../controllers/ephemeris'); // Import controller

// Route for ephemeris calculations (POST request)
router.post('/ephemeris', async (req, res) => {
  console.log('Ephemeris calculation route called');

  try {
    // Call the 'compute' function from the EphemerisController
    const result = await EphemerisController.compute(req.body);

    // Send the response back based on the result from the controller
    res.status(result.statusCode).json(result);
  } catch (error) {
    // Log the error and send a 500 (Internal Server Error) response
    console.error('Ephemeris calculation route error:', error.message);
    res.status(500).json({
      statusCode: 500,
      message: `Calculation failed: ${error.message}`
    });
  }
});

module.exports = router;
