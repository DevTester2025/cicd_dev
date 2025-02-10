import * as express from "express";
import controller from "./controller";
export default express
  .Router()
  .post("/create", controller.create)
  .post("/bulkcreate", controller.bulkCreate)
  .post("/update", controller.update)
  .post("/bulkupdate", controller.bulkUpdate)
  .post("/list", controller.all)
  .get("/:id", controller.byId)
  .post("/estimate", controller.estimate);
