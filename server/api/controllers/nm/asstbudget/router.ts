import * as express from "express";
import controller from "./controller";
export default express
  .Router()
  .post("/create", controller.create)
  .post("/list", controller.all)
  .post("/download", controller.download)
  .get("/:id", controller.byId)
  .post("/update", controller.update);
