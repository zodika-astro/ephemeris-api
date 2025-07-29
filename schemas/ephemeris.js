const Joi = require('joi');

const ephemerisSchema = Joi.object({
  year: Joi.number().integer().min(1000).max(9999).required(),
  month: Joi.number().integer().min(1).max(12).required(),
  date: Joi.number().integer().min(1).max(31).required(),
  hours: Joi.number().integer().min(0).max(23).required(),
  minutes: Joi.number().integer().min(0).max(59).required(),
  seconds: Joi.number().integer().min(0).max(59).default(0),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  timezone: Joi.number().min(-12).max(14).required(),
  config: Joi.object({
    observation_point: Joi.string().valid('topocentric', 'geocentric').required(),
    ayanamsha: Joi.string().valid('tropical', 'sidereal').required(),
    language: Joi.string().valid('pt', 'en', 'es', 'fr').default('pt')
  }).required()
});

module.exports = ephemerisSchema;
