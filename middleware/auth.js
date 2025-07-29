const logger = require('../logger');

function verifyApiKey(req, res, next) {
  // Check both header and query parameter for API key
  const apiKey = req.header('X-API-KEY') || req.query.apiKey;
  
  if (!apiKey) {
  logger.warn({ ip: req.ip }, 'Missing API key from request');
  return res.status(401).json({ error: 'API key is missing' });
  }

  if (!process.env.API_KEY) {
  logger.error('API_KEY not configured in environment');
  return res.status(501).json({ error: 'API key not configured on server' });
  }

  if (apiKey !== process.env.API_KEY) {
  logger.warn({ ip: req.ip, key: apiKey }, 'Invalid API key attempt');
  return res.status(403).json({ error: 'Invalid API key' });
  }

// Attach client info for logging
  req.client = { 
    ip: req.ip,
    authMethod: 'api_key',
    timestamp: new Date().toISOString() 
  };
  next();
}

module.exports = { verifyApiKey };
