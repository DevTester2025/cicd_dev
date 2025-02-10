import * as express from "express";
import controller from "./controller";
export default express
  .Router()
  .post("/create", controller.create)
  .post("/import", controller.import)
  .post("/update", controller.update)
  .post("/list", controller.all)
  .get("/:id", controller.byId)
  .post("/detailupdate", controller.monitoringUpdate)
