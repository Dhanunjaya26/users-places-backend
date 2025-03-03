const axios = require("axios");

const HTTPError = require("../models/http-error");

const API_KEY = process.env.GOOGLE_API_KEY;

const getCoordsForAddress = async (address) => {
  const response = await axios.get(
    `https://us1.locationiq.com/v1/search?key=${API_KEY}&q=${encodeURIComponent(
      address
    )}&format=json`
  );

  const data = response?.data[0];

  if (!data || data.status === "ZERO_RESULTS") {
    throw new HTTPError("Couldn't find the results", 404);
  }

  const coordinates = {
    lat: data.lat,
    lng: data.lon,
  };

  return coordinates;
};

module.exports = getCoordsForAddress;
