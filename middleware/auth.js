require('dotenv').config();

function verifyApiKey(req, res, next) {
  // Check both header and query parameter for API key
  const apiKey = req.header('X-API-KEY') || req.query.apiKey;
  
  if (!process.env.API_KEY) {
    console.error('API_KEY not configured in environment');
    return res.status(501).json({ error: 'Authentication not configured' });
  }

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  if (apiKey !== process.env.API_KEY) {
    console.warn(`Invalid API key attempt from ${req.ip}`);
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
