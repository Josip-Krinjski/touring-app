class AppError extends Error {
  constructor(message, statusCode) {
    // Handled by Error
    super(message);

    // Handled by AppError
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
