import * as express from "express";
import controller from "./controller";
export default express
  .Router()
  .post("/list", controller.all)
  .post("/create", controller.create)
  .post("/update", controller.update)
  .get("/:id", controller.byId);
