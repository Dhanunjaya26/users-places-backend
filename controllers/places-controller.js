const { validationResult } = require("express-validator");

const HTTPError = require("../models/http-error");
const Place = require("../models/place");
const getCoordsForAddress = require("../utils/location");

let DUMMY_PLACES = [
  {
    id: "p1",
    title: "Empire State Building",
    description: "One of the most famous skyscrapers in the world",
    imageUrl:
      "https://th.bing.com/th?id=OLC.lp5u7VeEyp0Iew480x360&w=210&h=140&c=8&rs=1&qlt=90&o=6&dpr=1.3&pid=3.1&rm=2",
    address: "20 W 34th St, New York, NY 10001",
    Location: {
      lat: 40.7484,
      lng: -73.9857,
    },
    creator: "u1",
  },
  {
    id: "p3",
    title: "vanekka State Building",
    description: "One of the most famous skyscrapers in the world",
    imageUrl:
      "https://th.bing.com/th?id=OLC.lp5u7VeEyp0Iew480x360&w=210&h=140&c=8&rs=1&qlt=90&o=6&dpr=1.3&pid=3.1&rm=2",
    address: "20 W 34th St, New York, NY 10001",
    Location: {
      lat: 40.7484,
      lng: -73.9857,
    },
    creator: "u1",
  },
  {
    id: "p2",
    title: "Dhanu State Building",
    description: "One of the most famous skyscrapers in the world",
    imageUrl:
      "https://th.bing.com/th?id=OLC.lp5u7VeEyp0Iew480x360&w=210&h=140&c=8&rs=1&qlt=90&o=6&dpr=1.3&pid=3.1&rm=2",
    address: "20 W 34th St, New York, NY 10001",
    Location: {
      lat: 40.7484,
      lng: -73.9857,
    },
    creator: "u2",
  },
];

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

  let places;
  try {
    places = await Place.find({ creator: userId }); // same as findById explanation on why we use await here.
  } catch (err) {
    return next(
      new HTTPError("Something went wrong while finding places", 500)
    );
  }

  if (places.length === 0) {
    return next(
      new HTTPError("Coudn't find places with the given user ID", 404)
    );
  }
  res.json({
    places: places.map((place) => place.toObject({ getters: true })),
  });
};

const createPlace = async (req, res, next) => {
  const { errors } = validationResult(req);
  if (errors.length) {
    return next(
      new HTTPError("Invalid data received, can't add the place", 422)
    ); //you have to always propagate error using next() in async function because if you throw instead of return next(), promise is rejected immediately and express global error handling middleware(last middleware in app.js) can't catch the error that you throw. In sync function you can use either throw or return next() and express can catch the error. To maintain consistency, use next() in the middleware functions with (req, res, next) arguments in your next project.
  }
  const { title, description, address, creator, imageUrl } = req.body;

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
    imageUrl,
    address,
    location: coordinates,
    creator,
  });

  let result;
  try {
    result = await createdPlace.save();
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
    place = await Place.findById(placeId);
  } catch (err) {
    return next(
      new HTTPError("Something went wrong while deleting place", 500)
    );
  }

  if (!place) {
    return next(new HTTPError("Could not find the place to delete", 404));
  }

  try {
    await place.deleteOne();
  } catch (err) {
    return next(new HTTPError("Error while deleting place", 500));
  }

  res.status(200).json({ message: "Deleted the place successfully" });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
