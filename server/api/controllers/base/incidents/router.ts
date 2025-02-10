import * as express from "express";
import controller, { pagerduty } from "./controller";
export default express
  .Router()
  .post("/create", controller.create)
  .post("/pagerduty", pagerduty)
  .post("/update", controller.update)
  .post("/list", controller.all)
  .get("/:id", controller.byId)
  .delete("/delete/:id", controller.delete)