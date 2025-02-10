import * as express from "express";
import controller from "./controller";
export default express
  .Router()
  .get("/count", controller.getAssetsCount)
  .get("/totalcost", controller.getTotalCost)
  .post("/filterby", controller.getAssetsByFilter)
  .post("/instances", controller.getMonitoringInstances)
  .post("/list", controller.all)
  .post("/instance/:action", controller.processInstance)
  .post("/productlist", controller.productlist)
  .post("/product/add", controller.addProduct)
  .post("/product/update", controller.updateProduct)
  .post("/txnref/bulkcreate", controller.bulkcreateTxnref);
