import * as express from "express";
import controller from "./controller";
export default express
  .Router()
  .post("/create", controller.create)
  .post("/storeevents", controller.storeEvents)
  .post("/grafanaalert", controller.getAlerts)
  .post("/update", controller.update)
  .post("/list", controller.all)
  .get("/:id", controller.byId)
  .delete("/delete/:id", controller.delete)