const express = require("express");
const tourController = require("../controllers/tourController");

const router = express.Router();

// DATA ALIASING
router
  .route("/top-5-cheap")
  .get(tourController.getTopFiveCheapTours, tourController.getAllTour);

// DATA AGGREGATION
router.route("/tour-stats").get(tourController.getTourStats);
router.route("/monthly-plan/:year").get(tourController.getMonthlyPlan)

router
  .route("/")
  .get(tourController.getAllTour)
  .post(tourController.createTour);

router
  .route("/:id")
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
