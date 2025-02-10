import * as express from "express";
import controller from "./controller";
export default express
  .Router()
  .post("/create", controller.create)
  .post("/list", controller.all)
  .get("/:id", controller.byId)
  .post("/report", controller.report)
  .post("/process", controller.process)
  .post("/daily/datacollection", controller.getDailyReport);
