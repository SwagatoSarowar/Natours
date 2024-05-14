const AppError = class extends Error {
  constructor(errorMessage, statusCode) {
    super(errorMessage);

    this.statusCode = statusCode;
    this.status = String(statusCode).startsWith("4") ? "fail" : "error";
    this.isOperational = true;
  }
};

module.exports = AppError;
