// Logs when the ephemeris route file is entered.
console.log('Entered ephemeris route');

const express = require('express');
const router = express.Router();
const InfoController = require('../common/info'); // Renamed for clarity
const compression = require('compression'); // Import compression middleware
const NodeCache = require('node-cache'); // Import node-cache for in-memory caching

// Initialize cache with a TTL (Time To Live) of 600 seconds (10 minutes)
// for cached items. This means cached responses will be valid for 10 minutes.
const apiCache = new NodeCache({ stdTTL: 600 });

// Enable Gzip compression for all responses served by this router.
// This reduces the size of the response body, speeding up data transfer.
router.use(compression());

// Route to get general API information.
router.get('/info', (req, res, next) => {
const cacheKey = 'apiInfo'; // Unique key for caching this response

// Try to retrieve data from cache first
const cachedResponse = apiCache.get(cacheKey);
if (cachedResponse) {
    // If found in cache, return immediately
    res.locals.status = 200;
    res.locals.message = 'Ephemeris API info successfully retrieved from cache.';
    res.locals.results = cachedResponse;
    return next(); // Use return next() to stop further execution in this route handler
  }

  // If not in cache, fetch data, store it, and then send
  const infoData = InfoController.info();
  apiCache.set(cacheKey, infoData); // Store the fetched data in cache

  res.locals.status = 200;
  res.locals.message = 'Ephemeris API info successfully retrieved.';
  res.locals.results = infoData;
  next();
});

// Route to check the API's health status.
router.get('/health', (req, res, next) => {
  const cacheKey = 'apiHealth'; // Unique key for caching this response

  // Try to retrieve data from cache first
  const cachedResponse = apiCache.get(cacheKey);
  if (cachedResponse) {
    // If found in cache, return immediately
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

// Mounts version 1 routes.
router.use('/v1', require('./vers1.js'));

module.exports = router;
