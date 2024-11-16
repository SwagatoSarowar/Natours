const Review = require("../models/reviewModel");
const catchAsync = require("../utils/catchAsync");

// GET ALL REVIEW
exports.getAllReview = catchAsync(async function (req, res, next) {
  const review = await Review.find();

  res
    .status(200)
    .json({ status: "success", result: review.length, data: { review } });
});

// CREATE REVIEW
exports.createReview = catchAsync(async function (req, res, next) {
  const { review, rating, tour } = req.body;
  const newReview = await Review.create({
    review,
    rating,
    tour,
    user: req.user._id,
  });

  res.status(201).json({ status: "success", data: { review: newReview } });
});
