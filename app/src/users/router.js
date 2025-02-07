const express = require("express");
const router = express.Router();
const UserController = require("./controller");

router.get("/", UserController.findAll);
router.post("/create", UserController.create);
router.get("/:id", UserController.findById);
router.put("/update/:id", UserController.update);
router.patch("/delete/:id", UserController.delete);

module.exports = router;
