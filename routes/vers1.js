'use strict';

const express = require('express');
const router = express.Router();
const EphemerisController = require('../controllers/ephemeris'); // ephemeris controller
const { generateNatalChartImage } = require('../controllers/generateChartImage'); // chart image generator
const logger = require('../logger'); // Import the logger for consistent logging

// Log when the ephemeris version 1 route file is entered.
logger.info('Entered ephemeris route (routes/vers1.js)');

// ephemeris calculations (POST request)
router.post('/ephemeris', async (req, res) => {
  logger.info('Ephemeris calculation route called'); // Using logger for consistency

  try {
    // Call the 'compute' function from the EphemerisController
    const result = await EphemerisController.compute(req.body);

    // Send the response back based on the result from the controller
    res.status(result.statusCode).json(result);
  } catch (error) {
    // Log the error and send a 500 (Internal Server Error) response
    logger.error(`Ephemeris calculation route error: ${error.message}`); // Using logger for consistency
    res.status(500).json({
      statusCode: 500,
      message: `Calculation failed: ${error.message}`
    });
  }
});

// Endpoint to generate and return the natal chart image
router.post('/ephemeris/chart-image', async (req, res) => {
  logger.info('Chart image generation route called'); // Log endpoint call

  try {
    // 1. Calculate the astrological data using your existing compute function
    const chartData = await EphemerisController.compute(req.body);

    // 2. Check if the calculation was successful
    if (chartData.statusCode !== 200) {
      // If there's an error in calculation, return the original error message
      logger.warn(`Chart image generation failed due to ephemeris calculation error: ${chartData.message}`);
      return res.status(chartData.statusCode).json(chartData);
    }

    // 3. Use the calculated data to generate the image buffer
    const imageBuffer = await generateNatalChartImage(chartData);

    // 4. Send the image as an HTTP response
    res.writeHead(200, {
      'Content-Type': 'image/png', // Set content type to PNG
      'Content-Length': imageBuffer.length // Inform the client about the image size
    });
    res.end(imageBuffer); // Send the image buffer

  } catch (error) {
    // Log any errors during the image generation process
    logger.error(`API chart image generation error: ${error.message}`);
    res.status(500).json({
      statusCode: 500,
      message: `Chart image generation failed: ${error.message}`
    });
  }
});

// Endpoint to generate and return the natal chart table
const { generateNatalTableImage } = require('../controllers/generateTableImage');

router.post('/ephemeris/table-image', async (req, res) => {
  logger.info('Table image generation route called'); // Log endpoint call

  try {
    // 1. Calculate the astrological data using your existing compute function
    const chartData = await EphemerisController.compute(req.body);

    // 2. Check if the calculation was successful
    if (chartData.statusCode !== 200) {
      logger.warn(`Table image generation failed due to ephemeris calculation error: ${chartData.message}`);
      return res.status(chartData.statusCode).json(chartData);
    }

    // 3. Use the calculated data to generate the image buffer
    const imageBuffer = await generateNatalTableImage(chartData);

    // 4. Send the image as an HTTP response
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': imageBuffer.length
    });
    res.end(imageBuffer);

  } catch (error) {
    // Log any errors during the image generation process
    logger.error(`API table image generation error: ${error.message}`);
    res.status(500).json({
      statusCode: 500,
      message: `Table image generation failed: ${error.message}`
    });
  }
});

module.exports = router;
