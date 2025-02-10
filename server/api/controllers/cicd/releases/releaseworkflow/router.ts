import * as express from "express";
import controller from "./controller";
export default express
  .Router()
  .get("/", controller.all)
  .post("/cancel",controller.cancelWorkflow)
  .post("/rerun",controller.reRunWorkflow)
  .get("/log/:id",controller.getWorkflowLog)
  .get("/:id",controller.getWorkflowView);