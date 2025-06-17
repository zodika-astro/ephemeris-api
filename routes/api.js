'use strict';

console.log('Entered API route file (routes/api.js)');

const express = require('express');
const router = express.Router();
const InfoController = require('../common/info');
const compression = require('compression');
const NodeCache = require('node-cache');
const { verifyApiKey } = require('../middleware/auth');

const apiCache = new NodeCache({ stdTTL: 600 });

router.use(compression());

// Public route
router.get('/info', (req, res) => {
  const cacheKey = 'apiInfo';
  const cachedResponse = apiCache.get(cacheKey);
  if (cachedResponse) {
    return res.status(200).json({
      message: 'Ephemeris API info successfully retrieved from cache.',
      results: cachedResponse
    });
  }

  const infoData = InfoController.info();
  apiCache.set(cacheKey, infoData);

  res.status(200).json({
    message: 'Ephemeris API info successfully retrieved.',
    results: infoData
  });
});

// Protected route
router.get('/secure-ephemeris', verifyApiKey, (req, res) => {
  console.log('🔐 secure-ephemeris route hit');
  res.status(200).json({
    message: 'Access granted. Valid API key!',
    results: { data: 'Ephemeris data only for authorized clients.' }
  });
});

// Public route
router.get('/health', (req, res) => {
  const cacheKey = 'apiHealth';
  const cachedResponse = apiCache.get(cacheKey);
  if (cachedResponse) {
    return res.status(200).json({
      message: 'Ephemeris API health status successfully retrieved from cache.',
      results: cachedResponse
    });
  }

  const healthData = InfoController.health();
  apiCache.set(cacheKey, healthData);

  res.status(200).json({
    message: 'Ephemeris API health status successfully retrieved.',
    results: healthData
  });
});

router.use('/v1', require('./vers1.js'));

module.exports = router;
