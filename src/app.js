const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");

const errorController = require("./controllers/errorController");
const AppError = require("./utils/appError");
const tourRouter = require("./routes/tourRoute");
const userRouter = require("./routes/userRoute");

const app = express();

const limiter = rateLimit({
  // limits the request to 100 reqs per hour.
  windowMs: 1 * 60 * 60 * 1000, // 1 hour
  limit: 100,
  message: "Too many requests from this IP. Please try again in an hour.",
});

// global middlewares
app.use(helmet()); // sets some security headers
app.use(express.json());
app.use(cors());
// sanitize the data after gettind the body / data.
app.use(mongoSanitize());
// limiter will be applied in all the routes that starts with api, thus all the api routes.
app.use("/api", limiter);

// routes
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);

// error handler for no api endpoint match
app.all("*", function (req, res, next) {
  // if next function gets an argument it will take that as an error from anywhere in app
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(errorController);

module.exports = app;
