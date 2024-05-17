const validator = require("validator");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const crypto = require("crypto");

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
  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user",
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
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: {
    type: Date,
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

// automatically update the passwordChangedAt when password is changed. (can do it in the controller as well, but this here makes it more automated)
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now();
  next();
});

// this method here is an instance method which will be available in all the instances of the user model
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.isPasswordChangedAfterJWT = function (jwtIssuedAt) {
  if (this.passwordChangedAt) {
    return new Date(this.passwordChangedAt).getTime() > jwtIssuedAt * 1000;
  }

  return false;
};

// when user wants to reset password, a token will be generated and stored in db after hashing (can use crypto as it doesn't need to be
// as secure as the bcrypted password)
userSchema.methods.generatePasswordResetToken = function () {
  // generating a random reset token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // todo: here the data is modified but not saved. so keep in mind to call save method when you call this method in an instance.
  // hashing the token as it will be stored in the db
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // token will be valid for 10 mins from the issueing.
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken; // returning to the user the un-hashed token.
};

const User = mongoose.model("User", userSchema);

module.exports = User;
