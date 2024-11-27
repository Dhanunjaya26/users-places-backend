const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const HTTPError = require("../models/http-error");

const DUMMY_USERS = [
  {
    id: "u1",
    name: "dhanu",
    email: "dhanu@gmail.com",
    password: "dhanu26",
  },
  {
    id: "u2",
    name: "jaya",
    email: "jaya@gmail.com",
    password: "jaya26",
  },
];

const getUsers = (req, res, next) => {
  res.json({ users: DUMMY_USERS });
};

const signUp = (req, res, next) => {
  const { errors } = validationResult(req);
  if (errors.length) {
    throw new HTTPError("Invalid inputs passed, please check your data", 422);
  }
  const { name, email, password } = req.body;

  if (DUMMY_USERS.find((u) => u.email === email)) {
    throw new HTTPError("Could not create user, Email already exists", 422);
  }

  const newUser = {
    id: uuidv4(),
    name,
    email,
    password,
  };
  DUMMY_USERS.push(newUser);

  res.status(201).json({ newUser });
};

const login = (req, res, next) => {
  const { email, password } = req.body;

  const user = DUMMY_USERS.find((u) => u.email === email);
  if (!user || user.password !== password) {
    throw new HTTPError(
      "Couldn't identify user, credentials seem to be wrong",
      401
    );
  }

  res.json({ message: "Login Successful" });
};

exports.getUsers = getUsers;
exports.login = login;
exports.signUp = signUp;
