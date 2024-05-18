const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { promisify } = require("util");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/sendEmail");

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

  // sending jwt via cookie.
  res.cookie("jwt", token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ), // turning days into milisec.
    // ! keeping secure to false for now, so that it works with http. if set to false it wont work unless its https
    // secure: true,
    httpOnly: true, // makes sure that browser cant change the token, its http only.
  });

  // even the password select is false in schema, as its a new user it shows the password when sending the data back. so we set the password to undefined
  // thus it won't send the password, also as we didnt use save on newUser, the password won't be undefined in the db.
  newUser.password = undefined;

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

  // sending jwt via cookie.
  res.cookie("jwt", token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ), // turning days into milisec.
    // ! keeping secure to false for now, so that it works with http. if set to false it wont work unless its https
    // secure: true,
    httpOnly: true, // makes sure that browser cant change the token, its http only.
  });

  // sending response to client
  res.status(200).json({ status: "success", token });
});

// FORGET PASSWORD
exports.forgetPassword = catchAsync(async function (req, res, next) {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) return next(new AppError("User doesn't exist", 404));

  const resetToken = user.generatePasswordResetToken();
  // some changes are made in the method so in order to save it in the db we call .save() method
  // we also need to remove all the validatin otherwise it will ask for all the required fields (like  password .)
  await user.save({ validateBeforeSave: false });

  // we will send the user an email with the password reset link to reset his password.
  const passwordResetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  // here its not enough for our global error handler to handle the error because in case of any error we need to reset the token and token expires
  // so we need to use try catch here.

  try {
    await sendEmail({
      email,
      subject: "Password reset link",
      message: `Reset Your password here ${passwordResetURL}`,
    });

    // sending response to client
    res.status(200).json({
      status: "success",
      message:
        "Password reset email has been send to your email. (Valid for 10 mins)",
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });

    next(
      new AppError(
        "There was an error sending email. Please try again later.",
        500
      )
    );
  }
});

// RESET PASSWORD
exports.resetPassword = catchAsync(async function (req, res, next) {
  const { token } = req.params;
  const { newPassword, confirmPassword } = req.body;
  const passwordResetToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // checking if the user exist with valid token
  if (!user)
    return next(
      new AppError("Token is invalid or expired. Please try again", 400)
    );

  user.password = newPassword;
  user.confirmPassword = confirmPassword;
  // user.passwordChangedAt = Date.now();  ====> this one we can do here, but better if we do that in the schema as a pre middleware.
  user.passwordResetExpires = undefined;
  user.passwordResetToken = undefined;

  await user.save();

  res.status(200).json({
    status: "success",
    message: "Password has been updated. Try login with your new password",
  });
});

// UPDATE PASSWORD
exports.updatePassword = catchAsync(async function (req, res, next) {
  const user = await User.findById(req.user._id).select("+password");
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!(await user.correctPassword(currentPassword, user.password)))
    return next(new AppError("Incorrect current password.", 401));

  user.password = newPassword;
  user.confirmPassword = confirmPassword;

  await user.save();

  res.status(200).json({
    status: "success",
    message:
      "Your password has been changed. Please login again with new password.",
  });
});

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
