const mongoose = require("mongoose");

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      unique: true,
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Tour difficulty is either easy, medium or difficult",
      },
    },
    secretTour: {
      type: Boolean,
      default: false,
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      require: [true, "A tour must have a price"],
    },
    priceDiscount: {
      type: Number,
      validate: {
        // custom validator. (need to return a boolean value)
        validator: function (val) {
          return val < this.price;
        },
        message: "Discount price should be less than original price",
      },
    },
    summary: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "A tour must have a description"],
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have a cover image"],
    },
    images: [String],
    startDates: [Date],
    slug: String,
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    updatedAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    // this is the schema option
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//  Virtual properties (property that can be derived from other property and don't need to be saved on the db)
tourSchema.virtual("durationWeek").get(function () {
  return this.duration / 7;
});

// Document middleware for mongoose (works same way as express)
tourSchema.pre("save", function (next) {
  this.slug = this.name.toLowerCase().split(" ").join("-");
  next();
});

/*
 Query middleware (runs before quering the document)
 regex /^find/ matches all the find methods and make sure that the secret doesn't get queried
 for only find other query like findOne or findById will get the secret data
*/
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  next();
});

/*
 like pre middleware, mongoose also have post query middle ware which works like following =>
  tourSchema.post(/^find/, function(docs, next){
    * with next, this middleware also get the documents that has beend queried
    console.log(docs);
    next();
  })
*/

// Aggregation middleware (runs before or after aggregation)
tourSchema.pre("aggregate", function (next) {
  //this.pipeline() gives us the aggregate pipeline object and we can remove or add any property in it
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
