import * as express from "express";
import controller from "./vpccontroller";
export default express
  .Router()
  .post("/create", controller.create)
  .post("/update", controller.update)
  .post("/list", controller.all)
  .get("/:id", controller.byId);
