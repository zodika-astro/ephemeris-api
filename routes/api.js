'use strict';
// Log when this API route file is entered.
console.log('Entered API route file (routes/api.js)');

const express = require('express');
const router = express.Router();
const InfoController = require('../common/info'); // Renamed for clarity
const compression = require('compression'); // Import compression middleware
const NodeCache = require('node-cache'); // Import node-cache for in-memory caching
const { verifyApiKey } = require('../app');

// Route to get general API information.
router.get('/info', (req, res, next) => {
  const cacheKey = 'apiInfo'; // Unique key for caching this response

  // Try to retrieve data from cache first
  const cachedResponse = apiCache.get(cacheKey);
  if (cachedResponse) {
    res.locals.status = 200;
    res.locals.message = 'Ephemeris API info successfully retrieved from cache.';
    res.locals.results = cachedResponse;
    return next();
  }

  // If not in cache, fetch data, store it, and then send
  const infoData = InfoController.info();
  apiCache.set(cacheKey, infoData); // Store the fetched data in cache

  res.locals.status = 200;
  res.locals.message = 'Ephemeris API info successfully retrieved.';
  res.locals.results = infoData;
  next();
});

router.get('/secure-ephemeris', verifyApiKey, (req, res, next) => {
  console.log('🔐 secure-ephemeris route hit');
  res.locals.status = 200;
  res.locals.message = 'Access granted. Valid API key!';
  res.locals.results = { data: 'Ephemeris data only for authorized clients.' };
  next();
});

router.get('/health', (req, res, next) => {
  const cacheKey = 'apiHealth';
  const cachedResponse = apiCache.get(cacheKey);
  if (cachedResponse) {
    res.locals.status = 200;
    res.locals.message = 'Ephemeris API health status successfully retrieved from cache.';
    res.locals.results = cachedResponse;
    return next();
  }

  const healthData = InfoController.health();
  apiCache.set(cacheKey, healthData);

  res.locals.status = 200;
  res.locals.message = 'Ephemeris API health status successfully retrieved.';
  res.locals.results = healthData;
  next();
});

  const cachedResponse = apiCache.get(cacheKey);
  if (cachedResponse) {
    res.locals.status = 200;
    res.locals.message = 'Ephemeris API health status successfully retrieved from cache.';
    res.locals.results = cachedResponse;
    return next();
  }

  // If not in cache, fetch data, store it, and then send
  const healthData = InfoController.health();
  apiCache.set(cacheKey, healthData); // Store the fetched data in cache

  res.locals.status = 200;
  res.locals.message = 'Ephemeris API health status successfully retrieved.';
  res.locals.results = healthData;
  next();
});

// Mounts version 1 routes under /api/v1.
router.use('/v1', require('./vers1.js'));

module.exports = router;
