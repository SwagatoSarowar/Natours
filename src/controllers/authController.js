const jwt = require("jsonwebtoken");
const { promisify } = require("util");
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

// FORGET PASSWORD
exports.forgetPassword = catchAsync(async function (req, res, next) {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    next(new AppError("No user found by that email", 404));
  }
});

// RESET PASSWORD
exports.resetPassword = catchAsync(async function (req, res, next) {});

// route protectors middleware that checks if the user is valid and logged in by checking the recieved jwt.
exports.protect = catchAsync(async function (req, res, next) {
  // 1) check if the token exists and starts with 'Bearer'
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token)
    return next(
      new AppError(
        "You are not logged in. Please log in first to get access.",
        401
      )
    );

  // 2) verify the token (jwt.verify is a sync function to we are making it an async function using promisify built-in
  //  nodejs module)
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) check if the user exists or not
  const loggedUser = await User.findById(decoded.id);

  if (!loggedUser) return next(new AppError("The user doesn't exist.", 401));

  // 4) check if the password has been changed after issuing the token to user. (will use an instance method for this)
  if (loggedUser.isPasswordChangedAfterJWT(decoded.iat)) {
    return next(
      new AppError("Password has been changed. Please login again.", 401)
    );
  }

  // setting req.user as the logged user in case the next middleware needs the data about the user who just got access to the resources.
  req.user = loggedUser;

  // if all the 4 stages are ok than the next() will be called thus grant the user access to the resources
  next();
});

// a middleware which will get roles as arguments and check if the logged in user has the right permissions to access that route.
// * here the function needs to take roles as parameters, thus we need to return a function which will actually be the middleware
// * also with the concept of closure that middleware will have the access to the roles array.

exports.restrictTo = function (...roles) {
  return function (req, res, next) {
    // checking if the user has the right role.
    if (!roles.includes(req.user.role)) {
      next(new AppError("You don't have the right permission for this.", 403));
    }
    next();
  };
};
