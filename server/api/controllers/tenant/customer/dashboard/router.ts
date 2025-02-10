import * as express from "express";
import controller from "./controller";
export default express
  .Router()
  .post("/uptime", controller.getVmUptime)
  .post("/vmstatus", controller.getVMStatus)
  .post("/kpisummary", controller.kpisummary)
  .post("/alertcount", controller.getCounts)  
  .post("/datewisealertcount", controller.getDateWiseCounts)
  .post("/datalist", controller.getData)