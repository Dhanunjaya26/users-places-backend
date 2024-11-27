const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");

const HTTPError = require("../models/http-error");
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

const getPlaceById = (req, res, next) => {
  const placeId = req.params.pid;
  const place = DUMMY_PLACES.find((p) => p.id === placeId);

  if (!place) {
    throw new HTTPError("Could not find a place with the given ID", 404);
  }

  res.json({ place });
};

const getPlacesByUserId = (req, res, next) => {
  const userId = req.params.uid;
  const userPlaces = DUMMY_PLACES.filter((p) => p.creator === userId);

  if (userPlaces.length === 0) {
    return next(
      new HTTPError("Coudn't find places with the given user ID", 404)
    );
  }
  res.json({ userPlaces });
};

const createPlace = async (req, res, next) => {
  const { errors } = validationResult(req);
  if (errors.length) {
    return next(
      new HTTPError("Invalid data received, can't add the place", 422)
    );
  }
  const { title, description, address, creator } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    console.log("error", error);
    return next(error);
  }

  const newPlace = {
    id: uuidv4(),
    title,
    description,
    address,
    location: coordinates,
    creator,
  };

  DUMMY_PLACES.push(newPlace);

  res.status(201).json({ newPlace });
};

const updatePlace = (req, res, next) => {
  const { errors } = validationResult(req);
  if (errors.length) {
    throw new HTTPError(
      "Invalid data received, can't update place details",
      422
    );
  }
  const placeId = req.params.pid;

  const { title, description } = req.body;

  if (!DUMMY_PLACES.find((p) => p.id === placeId)) {
    throw new HTTPError("can't find a place to update", 404);
  }

  const updatedPlace = { ...DUMMY_PLACES.find((p) => p.id === placeId) }; //spreading data to create copy of the object or else we'll be modifying the original object as only reference will be assigned to updatedPlace.
  const placeIndex = DUMMY_PLACES.findIndex((p) => p.id === placeId);
  updatedPlace.title = title;
  updatedPlace.description = description;

  DUMMY_PLACES[placeIndex] = updatedPlace;

  res.status(200).json({ updatedPlace });
};

const deletePlace = (req, res, next) => {
  const placeId = req.params.pid;

  if (!DUMMY_PLACES.find((p) => p.id === placeId)) {
    throw new HTTPError("Could not find the place to delete", 404);
  }

  DUMMY_PLACES = DUMMY_PLACES.filter((p) => p.id !== placeId);

  res.status(200).json({ message: "Deleted the place successfully" });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
