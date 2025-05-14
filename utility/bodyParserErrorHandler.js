/**
 * Middleware to handle JSON parsing errors
 */
const bodyParserErrorHandler = (err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('JSON parsing error:', err.message);
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON in request body',
      details: 'The request body could not be parsed as valid JSON'
    });
  }
  next(err);
};

module.exports = bodyParserErrorHandler; 