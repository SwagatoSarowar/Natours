/* global error handling function (if a middleware has 4 arguments, express will automatically take that as an error handling middleware and 
  for any error in the app, this function will be called)
*/
const errorController = function (error, req, res, next) {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";

  res
    .status(error.statusCode)
    .json({ status: error.status, message: error.message });
};

module.exports = errorController;
