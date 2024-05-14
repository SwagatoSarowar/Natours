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
  },
  confirmPassword: {
    type: String,
    required: [true, "Please confirm the password"],
  },
});

userSchema.pre("save", async function (next) {
  if (this.password !== this.confirmPassword) {
    next(new AppError("Confirm password doesn't match given password", 400));
  }
  const hashed = await bcrypt.hash(this.password, 12);
  this.password = hashed;
  this.confirmPassword = undefined;
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
