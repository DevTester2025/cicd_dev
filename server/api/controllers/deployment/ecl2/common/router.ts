import * as express from "express";
import controller from "./controller";
import metadatacontroller from "./metadatacontroller";
import reportcontroller from "./reportcontroller";

export default express
  .Router()
  .post("/synchronization", controller.synchronization)
  .post("/metadata", metadatacontroller.metadata)
  .post("/assetdetail", reportcontroller.assetdetail);
