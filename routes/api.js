'use strict';

console.log('Entered API route file (routes/api.js)');

const express = require('express');
const router = express.Router();
const InfoController = require('../common/info');
const compression = require('compression');
const NodeCache = require('node-cache');
const { verifyApiKey } = require('../app');

const apiCache = new NodeCache({ stdTTL: 600 }); // Faltava criar o cache aqui!

router.use(compression());

// Public route
router.get('/info', (req, res, next) => {
  const cacheKey = 'apiInfo';
  const cachedResponse = apiCache.get(cacheKey);
  if (cachedResponse) {
    res.locals.status = 200;
    res.locals.message = 'Ephemeris API info successfully retrieved from cache.';
    res.locals.results = cachedResponse;
    return next();
  }

  const infoData = InfoController.info();
  apiCache.set(cacheKey, infoData);

  res.locals.status = 200;
  res.locals.message = 'Ephemeris API info successfully retrieved.';
  res.locals.results = infoData;
  next();
});

// Protected route
router.get('/secure-ephemeris', verifyApiKey, (req, res, next) => {
  console.log('🔐 secure-ephemeris route hit');
  res.locals.status = 200;
  res.locals.message = 'Access granted. Valid API key!';
  res.locals.results = { data: 'Ephemeris data only for authorized clients.' };
  next();
});

// Public route
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

// Mounts version 1 routes under /api/v1.
router.use('/v1', require('./vers1.js'));

module.exports = {
  app,
  verifyApiKey
};

