const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(new HTTPError("Could not hash password", 500));
  }

  const newUser = new User({
    name,
    email,
    password: hashedPassword,
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

  let token;
  try {
    token = await jwt.sign(
      { userId: newUser.id, email: newUser.email },
      "yohoho_luffy_dono",
      { expiresIn: "1h" }
    );
  } catch (err) {
    return next(
      new HTTPError("Could not generate token while signing up", 500)
    );
  }

  res
    .status(201)
    .json({ userId: newUser.id, email: newUser.email, token: token });
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

  if (!user) {
    return next(new HTTPError("User doesn't exist", 404));
  }

  let isValidUser;
  try {
    isValidUser = await bcrypt.compare(password, user.password);
  } catch (err) {
    return next(
      new HTTPError("Something went wrong while verifying password", 500)
    );
  }

  if (!isValidUser) {
    return next(
      new HTTPError(
        "Could not identify user, credentials seem to be wrong",
        403
      )
    );
  }

  let token;
  try {
    token = await jwt.sign(
      { userId: user.id, email: user.email },
      "yohoho_luffy_dono", //use the same private key as that of signup or else you will generate different tokens and later when client sends a req with token, you wouldn't be able to validate that properly on server.
      { expiresIn: "1h" }
    );
  } catch (err) {
    return next(
      new HTTPError("Could not generate token while logging in", 500)
    );
  }

  res.json({
    userId: user.id,
    email: user.email,
    token: token,
  });
};

exports.getUsers = getUsers;
exports.login = login;
exports.signUp = signUp;
