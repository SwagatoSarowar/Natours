const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");
const validator = require("validator");

// GET ALL USERS
exports.getAllUser = catchAsync(async function (req, res) {
  const users = await User.find();
  res.status(200).json({ status: "success", data: { users } });
});
