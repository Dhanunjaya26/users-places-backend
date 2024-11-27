const axios = require("axios");

const HTTPError = require("../models/http-error");

const API_KEY = "pk.3b7a61ed4040a61d41a427c7aa9e871c";

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
