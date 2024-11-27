const express = require("express");

const placesRouter = require("./routes/places-routes");
const usersRouter = require("./routes/users-routes");
const HTTPError = require("./models/http-error");

const app = express();

app.use(express.json());

app.use("/api/places", placesRouter);
app.use("/api/users", usersRouter);

app.use((req, res, next) => {
  return next(new HTTPError("route not found in your application", 404));
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "Unknown error occured" });
});

app.listen(5000);
