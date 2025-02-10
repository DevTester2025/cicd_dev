import * as express from "express";
import controller from "./controller";
export default express
  .Router()
  .post("/create", controller.create)
  .get("/", controller.all)
  .post("/update/:id",controller.update)
  .get("/:id", controller.byId)
  .post("/trigger",controller.triggerWorkflow)
  .delete("/delete/:id",controller.releaseDelete)
  .post("/orchestration", controller.orchestrationApproval)
  .post("/approval", controller.approvalWorkflow);