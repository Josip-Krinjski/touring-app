const AppError = require('../utils/appError');

const handleCastError = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const handleDuplicateFields = (err) => {
  const duplicatedFields = Object.keys(err.keyValue || {}).join(', ');
  const message = duplicatedFields
    ? `Duplicate value for field(s): ${duplicatedFields}`
    : 'Duplicate field value';

  return new AppError(`${message}. Please use another value.`, 400);
};

const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((error) => error.message);
  return new AppError(`Invalid input data. ${messages.join('. ')}`, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  console.error('ERROR', err);
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'dev') {
    return sendErrorDev(err, res);
  }

  let normalizedError = err;

  if (err.name === 'CastError') normalizedError = handleCastError(err);
  if (err.code === 11000) normalizedError = handleDuplicateFields(err);
  if (err.name === 'ValidationError') {
    normalizedError = handleValidationError(err);
  }

  return sendErrorProd(normalizedError, res);
};
