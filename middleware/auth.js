require('dotenv').config();

function verifyApiKey(req, res, next) {
  if (!process.env.API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const apiKey = req.header('X-API-KEY') || req.query.apiKey;
  if (apiKey === process.env.API_KEY) {
    return next();
  }
  
  return res.status(403).json({ error: 'Forbidden. Invalid or missing API key.' });
}

module.exports = { verifyApiKey };
