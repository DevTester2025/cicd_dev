import * as express from "express";
import controller from "../nodeproperties/controller";
export default express
.Router()
.post("/create", controller.create)
.post("/update", controller.update)
.get("/:id", controller.byId);