const validator = require("validator");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const AppError = require("../utils/appError");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "User must have a name"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Please provide an email address"],
    unique: true,
    validate: {
      validator: function (val) {
        return validator.isEmail(val);
      },
      message: "Please provide a valid email",
    },
  },
  photo: {
    type: String,
  },
  password: {
    type: String,
    required: [true, "Please provide an user password"],
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [true, "Please confirm the password"],
    validate: {
      // only works on .create() and .save()
      validator: function (el) {
        return el === this.password;
      },
      message: "Confirm password doesn't match given password",
    },
  },
});

userSchema.pre("save", async function (next) {
  // if the password is not changed or updated the hashing will not happen (in case of updating user name or email)
  if (!this.isModified("password")) return next();

  const hashed = await bcrypt.hash(this.password, 12);
  this.password = hashed;
  this.confirmPassword = undefined;
  next();
});

// this here is an instance method which will be available in all the instances of the user model
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
