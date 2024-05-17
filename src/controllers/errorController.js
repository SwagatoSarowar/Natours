const AppError = require("../utils/appError");

const sendErrorRes = function (error, res) {
  // sending error to client if the error is operational
  if (error.isOperational) {
    res
      .status(error.statusCode)
      .json({ status: error.status, message: error.message });
  } else {
    // for programming errors log this to console for debugging and send a generic response to client
    console.log(error);
    res.status(500).json({ status: "error", message: "Something went wrong." });
  }
};

// handling cast error (invalid mongodb id)
const handleCastError = function (error) {
  const message = `Invalid ${error.path} : ${error.value}`;
  return new AppError(message, 400);
};

// handling mongoose validation error
const handleValidationError = function (error) {
  return new AppError(error.message, 400);
};

// handlign duplicate field error
const handleDuplicateFieldError = function (error) {
  const message = `Duplicate field value : ${error.message.match(
    /"(.*?)"/
  )[0]}. Please enter another one.`;
  return new AppError(message, 400);
};

/* global error handling function (if a middleware has 4 arguments, express will automatically take that as an error handling middleware and 
  for any error in the app, this function will be called)
*/
const errorController = function (error, req, res, next) {
  // return res.json(error);
  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";

  if (error.name === "CastError") error = handleCastError(error);
  if (error.name === "ValidationError") error = handleValidationError(error);
  if (error.code === 11000) error = handleDuplicateFieldError(error);

  sendErrorRes(error, res);
};

module.exports = errorController;
