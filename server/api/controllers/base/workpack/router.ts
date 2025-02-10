import * as express from "express";
import controller from "./controller";
export default express
  .Router()
  .post("/export", controller.download)
  .post("/execute", controller.execute)
  .post("/execute/list", controller.executionList)
  .post("/watchlist/update", controller.updateWatchList)
  .post("/txnref", controller.txnList)
  .post("/workflowrelation/list", controller.workflowrelationList);