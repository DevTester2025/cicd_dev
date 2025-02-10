import * as express from "express";
import controller from "./controller";
export default express
  .Router()
  .get("/runner",controller.runnerList)
  .post("/sync/:id", controller.syncRepo)
  .post("/create",controller.create)
  .get("/", controller.all)
  .get("/:id", controller.byId)
  .post("/update/:id",controller.update)
  .delete("/delete/:id",controller.delete);