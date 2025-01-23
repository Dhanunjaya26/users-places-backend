const mongoose = require("mongoose");

// const uniqueValidator = require("@ladjs/mongoose-unique-validator");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true }, //we'll be querying our email a lot from the DB like for logging in signing up etc. In big user DB, you want to make sure your email is queried asap, and for that you can add unique: true property, this will create an index for the email which simply put speeds up the querying process.
  password: { type: String, required: true, minLength: 6 },
  image: { type: String, required: true },
  places: [{ type: mongoose.Types.ObjectId, required: true, ref: "Place" }],
});

// userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
