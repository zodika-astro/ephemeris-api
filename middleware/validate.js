const Joi = require('joi');

/**
 * Middleware to validate the request body against a Joi schema.
 * @param {Joi.Schema} schema
 */
function validateBody(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const messages = error.details.map(detail => detail.message);
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: messages,
      });
    }
    next();
  };
}

module.exports = validateBody;
