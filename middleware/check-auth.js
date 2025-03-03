const jwt = require("jsonwebtoken");
const HTTPError = require("../models/http-error");

module.exports = (req, res, next) => {
  if (req.method === "OPTIONS") {
    // Browser sends an OPTIONS req before sending the actual POST request to check if the server allows a specific type of request, if it succeeds, then the browser proceeds with sending the actual POST request.
    return next();
  }
  try {
    const authHeader = req.headers.authorization || req.headers.authorization; // returns "Bearer token"
    const token = authHeader.split(" ")[1]; // extracting token from "Bearer token"

    if (!token) {
      throw new Error("Authentication failed");
    }
    const decodedToken = jwt.verify(token, process.env.JWT_PRIVATE_KEY); //if this line fails, it goes into catch block. If passes, then execute next line
    req.userData = { userId: decodedToken.userId }; //attaching some data to the request in server, to be used in the next middlewares
    next(); //goes into the next middleware, i.e, post, patch and delete routes in places-routes.
  } catch (err) {
    return next(new HTTPError("Authentication failed!", 401));
  }
};
