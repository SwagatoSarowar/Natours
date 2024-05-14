const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const signToken = function (id) {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  return token;
};

// SIGN UP (registration)
exports.signup = catchAsync(async function (req, res) {
  const { name, email, password, image, confirmPassword } = req.body;
  const newUser = await User.create({
    name,
    email,
    password,
    image,
    confirmPassword,
  });

  const token = signToken(newUser._id);

  res.status(201).json({ status: "success", token, data: { user: newUser } });
});

// SIGN IN (log in)
exports.signin = catchAsync(async function (req, res, next) {
  const { email, password } = req.body;

  // throwing error if any of the two field is missing
  if (!email || !password) {
    return next(new AppError("Please provide your email and password", 400));
  }

  // need to use select password because by default the password is not selected in user model
  let user = await User.findOne({ email }).select("+password");

  /* checking if the user with given email exists and if the encrypted passwords matches (correctPassword is an instance method which is 
     available on every collections that are made out of user model
  */
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Invalid email and password combination", 401));
  }

  // signing a jwtoken
  const token = signToken(user._id);

  // sending response to client
  res.status(200).json({ status: "success", token });
});
