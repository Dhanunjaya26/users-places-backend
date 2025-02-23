const { validationResult } = require("express-validator");
const HTTPError = require("../models/http-error");
const User = require("../models/user");

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password"); // just find() returns an array of all the users from DB. but we want to make sure the response shouldn't contain password properties. To achieve this, we use filter parameters inside find method call. {} matches all the objects and '-password' means we don't want to include password in the response.
  } catch (err) {
    return next(new HTTPError("Fetching users failed, please try again.", 500));
  }

  res
    .status(201)
    .json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signUp = async (req, res, next) => {
  const { errors } = validationResult(req);
  if (errors.length) {
    return next(
      new HTTPError("Invalid inputs passed, please check your data", 422)
    );
  }

  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return next(new HTTPError("finding existing user failed", 500));
  }

  if (existingUser) {
    return next(
      new HTTPError("User already exists, please login instead", 422)
    );
  }

  const newUser = new User({
    name,
    email,
    password,
    image: req.file.path,
    places: [],
  });

  let result;
  try {
    result = await newUser.save();
  } catch (err) {
    console.log(err);
    return next(
      new HTTPError("Something went wrong while saving the user details", 500)
    );
  }

  res.status(201).json({ newUser: result.toObject({ getters: true }) });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let user;
  try {
    user = await User.findOne({ email: email });
  } catch (err) {
    return next(
      new HTTPError("Something went wrong while finding the user", 500)
    );
  }

  if (!user || user.password !== password) {
    return next(
      new HTTPError("Could not identify user, credentials seem to be wrong")
    );
  }

  res.json({
    message: "Login Successful",
    user: user.toObject({ getters: true }),
  });
};

exports.getUsers = getUsers;
exports.login = login;
exports.signUp = signUp;
