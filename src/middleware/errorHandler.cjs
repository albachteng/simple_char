/**
 * Error handling middleware - CommonJS version
 */

function errorHandler(err, req, res, next) {
  console.error("Error:", err.message);
  
  res.status(500).json({
    success: false,
    error: "Internal server error",
    timestamp: new Date().toISOString()
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: "Not found",
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
}

function timeoutHandler(timeout) {
  return (req, res, next) => {
    req.setTimeout(timeout, () => {
      res.status(408).json({
        success: false,
        error: "Request timeout",
        timestamp: new Date().toISOString()
      });
    });
    next();
  };
}

module.exports = { errorHandler, notFoundHandler, timeoutHandler };
