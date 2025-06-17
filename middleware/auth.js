require('dotenv').config();

function verifyApiKey(req, res, next) {
  const apiKey = req.header('X-API-KEY');
  if (apiKey && apiKey === process.env.API_KEY) {
    return next();
  }
  return res.status(403).json({ error: 'Forbidden. Invalid or missing API key.' });
}

module.exports = { verifyApiKey };
