const Tour = require("../models/tourModel");
const APIFeatures = require("../utils/apiFeatures");

// GET ALL TOURS
exports.getAllTour = async function (req, res) {
  try {
    // api with different features using js class
    const features = new APIFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const tours = await features.query;

    res
      .status(200)
      .json({ status: "success", results: tours.length, data: { tours } });
  } catch (error) {
    res.status(404).json({ status: "fail", message: error });
  }
};

// GET TOUR BY ID
exports.getTour = async function (req, res) {
  const id = req.params.id;
  const tour = await Tour.findById(id);
  res.status(200).json({ status: "success", data: { tour } });
};

// CREATE TOUR
exports.createTour = async function (req, res) {
  try {
    const tour = await Tour.create(req.body);
    res.status(201).json({ status: "success", data: { tour } });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error });
  }
};

// UPDATE TOUR
exports.updateTour = async function (req, res) {
  try {
    const id = req.params.id;
    const tour = await Tour.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ status: "success", data: { tour } });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error });
  }
};

// DELETE TOUR
exports.deleteTour = async function (req, res) {
  const id = req.params.id;
  await Tour.findByIdAndDelete(id);
  res.status(204).json({ status: "success", data: null });
};

// GET TOP 5 CHEAP TOURS MIDDLEWARE (aliasing)
exports.getTopFiveCheapTours = function (req, res, next) {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";

  next();
};

// GET TOUR STATS WITH MONGODB AGGREGATION
exports.getTourStats = async function (req, res) {
  try {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          _id: "$difficulty", // grouping tours by any fields we want (here its grouping by difficutly)
          numTours: { $sum: 1 }, // every documents which go through this pipline will add 1 in the numTours
          numRatings: { $sum: "$ratingsQuantity" },
          avgRating: { $avg: "$ratingsAverage" },
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
    ]);

    res.status(200).json({ status: "success", data: { stats } });
  } catch (error) {
    res.status(404).json({ status: "fail", message: error });
  }
};

exports.getMonthlyPlan = async function (req, res) {
  try {
    const year = Number(req.params.year);
    const plan = await Tour.aggregate([
      {
        $unwind: "$startDates",
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${year + 1}-01-01`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$startDates" },
          numTourStarts: { $sum: 1 },
          tours: { $push: "$name" },
        },
      },
      {
        $addFields: { month: "$_id" },
      },
      {
        $project: { _id: 0 },
      },
      {
        $sort: { numTourStarts: -1 },
      },
    ]);

    res.status(200).json({ status: "success", data: { plan } });
  } catch (error) {
    res.status(404).json({ status: "fail", message: error });
  }
};
