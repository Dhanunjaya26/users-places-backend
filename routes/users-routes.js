const { Router } = require("express");
const { check } = require("express-validator");

const { getUsers, login, signUp } = require("../controllers/users-controller");
const fileUpload = require("../middleware/file-upload");

const router = Router();

router.get("/", getUsers);

router.post("/login", login);

router.post(
  "/signup",
  fileUpload.single("image"),
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  signUp
);

module.exports = router;
