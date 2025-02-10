import * as express from "express";
import controller from "./controller";
export default express
  .Router()
  .post("/create", controller.create)
  .post("/update", controller.update)
  .post("/bulkupdate", controller.bulkupdate)
  .post("/list", controller.all)
  .get("/:id", controller.byId);
