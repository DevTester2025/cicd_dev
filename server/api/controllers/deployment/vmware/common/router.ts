import * as express from "express";
import controller from "./controller";
import assetHistory from "../../../../../common/assethistory";

export default express
  .Router()
  .post("/synchronization", assetHistory, controller.synchronization)
  .post("/filterby", controller.filterAssets)
