'use strict';

const express = require('express');
const router = express.Router();
const InfoController = require('../common/info');
const compression = require('compression');
const NodeCache = require('node-cache');
const path = require('path');

const { verifyApiKey } = require('../middleware/auth');
const validateBody = require('../middleware/validate');
const ephemerisSchema = require('../schemas/ephemeris');

const apiCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

// Apply compression middleware early
router.use(compression());

// Public endpoints
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

// Health check (public)
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Protected endpoints
const EphemerisController = require(path.resolve(__dirname, '..', 'controllers', 'ephemeris'));
const ChartController = require(path.resolve(__dirname, '..', 'controllers', 'generateChartImage'));
const TableController = require(path.resolve(__dirname, '..', 'controllers', 'generateTableImage'));

router.post('/ephemeris',
  verifyApiKey,
  validateBody(ephemerisSchema),
  EphemerisController.calculateEphemeris
);

router.post('/chart-image', verifyApiKey, ChartController.generateChartImage);
router.post('/table-image', verifyApiKey, TableController.generateTableImage);

// Versioned API
router.use('/v1', require('./vers1'));

module.exports = router;
