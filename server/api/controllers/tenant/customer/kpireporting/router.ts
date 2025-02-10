import * as express from "express";
import controller from "./controller";
export default express
  .Router()
  .post("/bulkcreate", controller.bulkcreate)
  .post("/bulkupdate", controller.bulkupdate)
  .post("/list", controller.all)
  .get("/:id", controller.byId)
  .post("/update", controller.update);
