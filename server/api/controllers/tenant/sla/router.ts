import * as express from "express";
import controller from "./controller";
export default express
  .Router()
  .post("/create", controller.create)
  .post("/update", controller.update)
  .post("/bulkupdpate", controller.bulkudate)
  .post("/list", controller.all)
  .get("/:id", controller.byId);
