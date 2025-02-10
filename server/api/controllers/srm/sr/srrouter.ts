import * as express from "express";
import controller from "./srcontroller";
export default express
  .Router()
  .post("/create", controller.create)
  .post("/update", controller.update)
  .post("/list", controller.all)
  .get("/:id", controller.byId)
  .post("/count", controller.count);
