const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const placesRouter = require("./routes/places-routes");
const usersRouter = require("./routes/users-routes");
const HTTPError = require("./models/http-error");

const app = express();

app.use(express.json());

app.use("/uploads/images", express.static(path.join("uploads", "images"))); //middleware to serve images from the server statically

//To handle CORS in browser: We have to send some headers in the response. We'll add a middleware before identifying the routes and sending responses
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); //allows any domain to send requests this backend
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

  next(); //after setting the headers, we forward the request to the next middlewares and every response would have the headers attached to them.
});

app.use("/api/places", placesRouter);
app.use("/api/users", usersRouter);

//A middleware at the end of route definitions catches all unmatched routes - Global 404 Handler
app.use((req, res, next) => {
  return next(new HTTPError("route not found in your application", 404));
});

//if you throw an error(HTTPError), it will end up here and below middleware is triggered - Global Error Handling Middleware
//This is a default expressJS error-handling middleware used to send back a standard uniform error message if something goes wrong
app.use((error, req, res, next) => {
  if (req.file) {
    //this helps in removing the image stored on server if any error occurs with that particular request
    fs.unlink(req.file.path, (err) => {
      console.error(err);
    });
  }
  if (res.headersSent) {
    //refer notes in notion about res.headersSent
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "Unknown error occured" });
});

mongoose
  .connect(
    "mongodb+srv://dhanu:iFFywzx6KsXcyjAq@cluster0.p38mc.mongodb.net/MERN?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => app.listen(5000))
  .catch((error) => console.log("error while connnecting to DB"));
