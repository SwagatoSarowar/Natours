const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");
const validator = require("validator");

// GET ALL USERS
exports.getAllUser = catchAsync(async function (req, res) {
  const users = await User.find();
  res.status(200).json({ status: "success", data: { users } });
});

exports.getUserById = async function(req, res, next){
  const {id} = req.params;
  const user = User.findById(id);

  next("user not found")
}