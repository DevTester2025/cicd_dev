import * as express from "express";
import controller from "./controller";
export default express
  .Router()
  .post("/create", controller.create)
  .post("/update", controller.update)
  .post("/list", controller.all)
  .post("/clone", controller.clone)
  .get("/:id", controller.byId)
  .get("/graph/:id", controller.getgraph)
  .get("/elc2/:id", controller.getecl2Id)
  .get("/ali/:id", controller.getaliId);
