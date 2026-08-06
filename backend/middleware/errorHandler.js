const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.name}: ${err.message}`);
  
  if (err.stack && process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  const statusCode = err.statusCode || 500;
  
  // No exponer detalles internos al cliente en producción
  const message = process.env.NODE_ENV === 'production' && statusCode === 500 
    ? 'Error interno del servidor' 
    : err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    ok: false,
    errorCode: err.errorCode || '0x500',
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

class CustomError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { errorHandler, CustomError };
