'use strict';

const express = require('express');
const router = express.Router();
const compression = require('compression');
const NodeCache = require('node-cache');
const path = require('path');

// Controllers
const InfoController = require('../common/info');
const EphemerisController = require(path.resolve(__dirname, '..', 'controllers', 'ephemeris'));
const ChartController = require(path.resolve(__dirname, '..', 'controllers', 'generateChartImage'));
const TableController = require(path.resolve(__dirname, '..', 'controllers', 'generateTableImage'));

// Middlewares
const { verifyApiKey } = require('../middleware/auth');
const validateBody = require('../middleware/validate');
const ephemerisSchema = require('../schemas/ephemeris');

// Setup cache
const apiCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

// Apply compression middleware early
router.use(compression());

//Public Endpoints

// Info endpoint (cached)
router.get('/info', (req, res) => {
  const cacheKey = 'apiInfo';
  const cachedResponse = apiCache.get(cacheKey);

  if (cachedResponse) {
    return res.json({
      message: 'Cached API info',
      results: cachedResponse,
      cached: true
    });
  }

  const infoData = InfoController.info();
  apiCache.set(cacheKey, infoData);

  res.json({
    message: 'Live API info',
    results: infoData,
    cached: false
  });
});

//Protected Endpoints

// Main ephemeris calculation
router.post(
  '/ephemeris',
  verifyApiKey,
  validateBody(ephemerisSchema),
  async (req, res) => {
    try {
      const result = await EphemerisController.calculateEphemeris(req.body);
      res.status(result.statusCode).json(result);
    } catch (err) {
      res.status(500).json({ message: 'Internal server error', error: err.message });
    }
}
);

// Generate natal chart image
router.post('/chart-image', verifyApiKey, ChartController.generateChartImage);

// Generate natal table image
router.post('/table-image', verifyApiKey, TableController.generateTableImage);

// Versioned API (if needed)
router.use('/v1', require('./vers1'));

module.exports = router;
