import * as express from "express";
import controller from "./controller";
import metadatacontroller from "./metadatacontroller";
import assetHistory from "../../../../../common/assethistory";

export default express
  .Router()
  .post("/synchronization", assetHistory, controller.synchronization)
  .post("/syncprice", controller.syncPricing)
  .post("/metadata", metadatacontroller.metadata)
  .post("/synctags", metadatacontroller.syncTags)
  .get("/downloadfile/:key", controller.getScriptFile)
  .post("/instancesync", controller.instanceSync);
