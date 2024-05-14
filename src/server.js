require("dotenv").config({ path: "./config.env" });

/* uncaught exceptions are like syncronous errors and it needs to be called higher so that it can listen for all the
 errors
*/
process.on("uncaughtException", function (error) {
  console.log(error.name, error.message);
  process.exit(1);
});

const app = require("./app");
const mongoose = require("mongoose");

const port = process.env.PORT || 8000;
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB).then(() => console.log("DB connected..."));

const server = app.listen(port, () =>
  console.log(`App running on port ${port} ...`)
);

// errors that are unhandled will be handled here (errors like not being able to connect to mongodb or some other errors)
process.on("unhandledRejection", function (error) {
  console.log(error.name, error.message);
  // shutting down the server
  server.close(() => {
    // shutting down the app after all the existing requests are processed with code 1.
    process.exit(1);
  });
});
