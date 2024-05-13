const express = require("express");
const cors = require("cors");
const app = express();
const tourRouter = require("./routes/tourRoute");

// middlewares
app.use(express.json());
app.use(cors());

// routes
app.use("/api/v1/tours", tourRouter);

// error handler for no api endpoint match
app.all("*", function (req, res, next) {
  res
    .status(404)
    .json({
      status: "fail",
      message: `Can't find ${req.originalUrl} on this server`,
    });
});

module.exports = app;
