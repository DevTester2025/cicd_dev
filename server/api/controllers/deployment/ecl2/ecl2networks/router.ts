import * as express from "express";
import controller from "./controller";
export default express
  .Router()
  .post("/create", controller.create)
  .post("/update", controller.update)
  .post("/list", controller.all)
  .post("/delete", controller.delete)
  .post("/connections", controller.tenantconnections)
  .post("/createconnreq", controller.tenantconnectionrequest)
  .post("/deleteconnreq", controller.deleteTenantConnReq)
  .post("/updateconnreq", controller.updateConnReqStatus)
  .get("/:id", controller.byId);
