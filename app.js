const express = require("express");
const mongoose = require("mongoose");

const placesRouter = require("./routes/places-routes");
const usersRouter = require("./routes/users-routes");
const HTTPError = require("./models/http-error");

const app = express();

app.use(express.json());

app.use("/api/places", placesRouter);
app.use("/api/users", usersRouter);

//A middleware at the end of route definitions catches all unmatched routes - Global 404 Handler
app.use((req, res, next) => {
  return next(new HTTPError("route not found in your application", 404));
});

//if you throw an error(HTTPError), it will end up here and below middleware is triggered - Global Error Handling Middleware
app.use((error, req, res, next) => {
  //This is a default expressJS error-handling middleware used to send back a standard uniform error message if something goes wrong
  if (res.headersSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "Unknown error occured" });
});

mongoose
  .connect(
    "mongodb+srv://dhanu:iFFywzx6KsXcyjAq@cluster0.p38mc.mongodb.net/places_DB?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => app.listen(5000))
  .catch((error) => console.log("error while connnecting to DB"));
