const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

router.post("/signup", authController.signup);
router.post("/signin", authController.signin);
router.post("/forget-password", authController.forgetPassword);
router.patch("/reset-password/:token", authController.resetPassword);
router.patch("/update-password", authController.protect, authController.updatePassword)

router.route("/").get(authController.protect, userController.getAllUser);

module.exports = router;
