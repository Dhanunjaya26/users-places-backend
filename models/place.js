const mongoose = require("mongoose");

const placeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  address: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" }, // modified type To tell MongoDB that this is a real MongoDB ID. ref property is used to establish a connection between our current placeSchema and any other schema (userSchema in this usecase).ref also allows us to use populate method used for populating referenced documents
});

module.exports = mongoose.model("Place", placeSchema); //this returns a constructor that helps to create a model
