import * as express from "express";
import controller from "./controller";
export default express
  .Router()
  .get("/", controller.all)
  .post("/create",controller.create)
  .get("/:id", controller.byId)
  .post("/update/:id",controller.update)
  .delete("/delete/:id",controller.delete);