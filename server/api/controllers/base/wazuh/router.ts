import * as express from "express";
import controller from "./controller";
export default express
  .Router()
  .post("/getdata", controller.getData)
  .post("/getagent", controller.getAgent)
  .get("/file/:key", controller.getfile)
  .post("/authenticate", controller.getAuthentication)
  .post("/updatewazuhagent", controller.updateWazuhAgent)
