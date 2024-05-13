const express = require("express");
const cors = require("cors");

const errorController = require("./controllers/errorController");
const AppError = require("./utils/appError");
const tourRouter = require("./routes/tourRoute");

const app = express();

// middlewares
app.use(express.json());
app.use(cors());

// routes
app.use("/api/v1/tours", tourRouter);

// error handler for no api endpoint match
app.all("*", function (req, res, next) {
  // if next function gets an argument it will take that as an error from anywhere in app
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(errorController);

module.exports = app;
