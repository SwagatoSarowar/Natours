const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");
const validator = require("validator");
const AppError = require("../utils/appError");

// GET ALL USERS
exports.getAllUser = catchAsync(async function (req, res) {
  const users = await User.find();
  res.status(200).json({ status: "success", data: { users } });
});

// GET USER BY ID
exports.getUserById = async function (req, res, next) {
  const { id } = req.params;
  const user = User.findById(id);

  next("user not found");
};

// UPDATE USER (FOR ADMIN)
exports.updateUser = catchAsync(async function (req, res, next) {});

// UPDATE CURRENT USER (FOR CURRENTLY LOGGED IN USER)
exports.updateCurrentUser = catchAsync(async function (req, res, next) {
  const { name, email, image } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      name,
      email,
      image,
    },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: "success",
    message: "Your information has been updated successfully.",
  });
});

// DELETE USER (FOR ADMIN)
exports.deleteUser = catchAsync(async function (req, res, next) {});

// DELETE CURRENT USER (FOR CURRENTLY LOGGED IN USER)
exports.deleteCurrentUser = catchAsync(async function (req, res, next) {
  await User.findByIdAndUpdate(req.user._id, { isActive: false });

  res.status(204).json({ status: "success", data: null });
});
