import * as express from "express";
import controller from "./controller";
export default express
.Router()
.get("/", controller.all)
.get("/:id", controller.byId)
.delete("/delete/:id",controller.delete)
.post("/create",controller.create)
.post("/update/:id",controller.update);