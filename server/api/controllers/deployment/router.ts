import * as express from "express";
import controller from "./controller";
import ecl2controller from "./ecl2/ecl2controller";
import alicontroller from "./alibaba/alicontroller";
import awscontroller from "./awscontroller";

export default express
  .Router()
  .post("/create", controller.create)
  .post("/update", controller.update)
  .post("/list", controller.all)
  .get("/:id", controller.byId)
  //.post('/deploy', controller.deploySolution)
  .post("/deploy", awscontroller.awsdeploy)
  .post("/log", controller.readFileLog)
  .post("/ecl2/deploy", ecl2controller.deploySolution)
  .post("/ecl2/update", ecl2controller.updateSolution)
  .post("/ecl2/delete", ecl2controller.deleteSolution)
  .post("/ecl2/vncconsole", ecl2controller.getVNCConsole)
  .post("/ecl2/list", controller.allecl2)
  .post("/ecl2/vsrx", ecl2controller.processvsrxCalls)
  .post("/ecl2/netscaler", ecl2controller.processCitrixCalls)
  .post("/ecl2/resize", ecl2controller.ecl2ResizeInsType)
  .post("/ali/deploy", alicontroller.deploySolution)
  .post("/aws/resize", awscontroller.awsResizeInsType)
  .post("/resync", controller.resyncassets);
