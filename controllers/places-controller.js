const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const fs = require("fs");

const HTTPError = require("../models/http-error");
const Place = require("../models/place");
const User = require("../models/user");
const getCoordsForAddress = require("../utils/location");

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId); // findById technically doesn't return a promise but we can still use await here because mongoDB takes care of it behind the scenes. and since finding takes a bit of time, its recommended to use await here. If you want it to return a real promise then you can do this: Place.findById(placeId).exec()
  } catch (err) {
    return next(new HTTPError("Something went wrong while finding place", 500));
  }

  if (!place) {
    return next(new HTTPError("Could not find a place with the given ID", 404));
  }

  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let user;
  try {
    user = await User.findById(userId).populate("places"); // same as findById explanation on why we use await here.
  } catch (err) {
    return next(
      new HTTPError("Something went wrong while finding places", 500)
    );
  }

  if (!user || user.places.length === 0) {
    return next(
      new HTTPError("Coudn't find places with the given user ID", 404)
    );
  }
  res.json({
    places: user.places.map((place) => place.toObject({ getters: true })),
  });
};

const createPlace = async (req, res, next) => {
  const { errors } = validationResult(req);
  if (errors.length) {
    return next(
      new HTTPError("Invalid data received, can't add the place", 422)
    ); //you have to always propagate error using next() in async function because if you throw instead of return next(), promise is rejected immediately and express global error handling middleware(last middleware in app.js) can't catch the error that you throw. In sync function you can use either throw or return next() and express can catch the error. To maintain consistency, use next() in the middleware functions with (req, res, next) arguments in your next project.
  }
  const { title, description, address } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    console.log("error", error);
    return next(error);
  }

  //creating a model
  const createdPlace = new Place({
    title,
    description,
    imageUrl: req.file.path,
    address,
    location: coordinates,
    creator: req.userData.userId,
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (error) {
    console.log("error", error);
    return next(
      new HTTPError("Something went wrong while searching for user", 500)
    );
  }

  if (!user) {
    return next(
      new HTTPError("Can't find user for the provided creator id", 404)
    );
  }

  let result;
  try {
    const newSession = await mongoose.startSession();
    newSession.startTransaction();
    result = await createdPlace.save({ session: newSession });
    user.places.push(createdPlace); //mongoose takes care of pushing the id of createdPlace generated from the above line to the places array of user.
    await user.save({ session: newSession });
    await newSession.commitTransaction();
    //Note: When working with sessions and transactions in MongoDB, keep in mind the following:
    // - If you are adding the first document to a collection (i.e., creating a new collection) within a transaction, you must manually create the collection before sending the request. This is because MongoDB does not automatically create collections during transactions.
    // - If your code does not include session or transaction logic, MongoDB will automatically create a new collection when you send a request to insert the first document.
    //By ensuring the collection is pre-created when using transactions, you can avoid unexpected errors during execution.
  } catch (error) {
    return next(new HTTPError("Creating place failed, please try again", 500));
  }

  // res.status(201).json({ place: createdPlace });
  res.status(201).json(result);
};

const updatePlace = async (req, res, next) => {
  const { errors } = validationResult(req);
  if (errors.length) {
    return next(
      new HTTPError("Invalid data received, can't update place details", 422)
    );
  }
  const placeId = req.params.pid;

  const { title, description } = req.body;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    return next(
      new HTTPError("Something went wrong while updating place", 500)
    );
  }

  if (!place) {
    return next(new HTTPError("Could not find a place to update", 404));
  }

  if (place.creator.toString() !== req.userData.userId) {
    return next(
      new HTTPError("You are not allowed to update this place!!", 401)
    );
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    return next(
      new HTTPError("Something went wrong while saving the updated place", 500)
    );
  }

  res.status(200).json({ updatedPlace: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate("creator"); //here as we pass 'creator' string to populate method, mongoose returns the corresponding user of the place which is referenced in creator(userID) property. We can use populate method here because we've added ref in both User and Place schemas to establish a relation
  } catch (err) {
    return next(
      new HTTPError("Something went wrong while deleting place", 500)
    );
  }

  if (!place) {
    return next(
      new HTTPError("Could not find the place for the given ID to delete", 404)
    );
  }

  if (place.creator.id !== req.userData.userId) {
    //creator.id here because with populate method, the creator property holds the full user details, whereas in the updatePlace method, the creator key just holds the user ID. And we don't have to call toString() here because the id getter already gives the string
    return next(
      new HTTPError("You are not allowed to delete this place!!", 401)
    );
  }

  const imageUrl = place.imageUrl;

  try {
    const newSession = await mongoose.startSession();
    newSession.startTransaction();
    await place.deleteOne({ session: newSession });
    place.creator.places.pull(place); //we can access the user using place.creator because of populate method
    await place.creator.save({ session: newSession });
    newSession.commitTransaction();
  } catch (err) {
    return next(new HTTPError("Error while deleting place", 500));
  }

  fs.unlink(imageUrl, (err) => {
    console.log(err);
  });

  res.status(200).json({ message: "Deleted the place successfully" });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
