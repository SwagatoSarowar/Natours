const express = require("express");
const cors = require("cors");
const app = express();
const tourRouter = require("./routes/tourRoute");

app.use(express.json());
app.use(cors());

app.use("/api/v1/tours", tourRouter);

module.exports = app;
