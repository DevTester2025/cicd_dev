import * as express from "express";
import controller from "./controller";
import assetRecord from "../../../../common/assetrecords";

export default express
  .Router()
  .post("/resourcetype", controller.getResourceType)
  .post("/resources/:type", controller.getResource)
  .post("/resourcedetails", controller.getResourceDetails)
  .post("/filter", controller.getResourceByFilter)
  .post("/resource/fieldvalues", controller.getDistinctFieldKeyValues)
  .get("/resource/:id", controller.getResourceById)
  .post("/create", controller.beforeRecordCreate, controller.create)
  .post("/update", controller.beforeUpdate, controller.update)
  .post("/bulkupdate", controller.beforeUpdate, controller.assetHdrBulkCreate)
  .post("/list", controller.all)
  .post("/resourcedetails/update", controller.assetDtlUpdate)
  .post("/resourcedetails/create", controller.assetDtlCreate)
  .post("/resourcedetails/list", controller.assetDtlAll)
  .post(
    "/resourcedetails/bulkcreate",
    assetRecord,
    controller.assetBeforeCreate
  )
  .post(
    "/resourcedetails/bulkupdate",
    assetRecord,
    controller.bulkUpdateDtl
  )
  .post("/chart", controller.getCustomizedKPI)
  .post("/externalref/list", controller.externalRefList)
  .post('/builder', controller.reportquerybuilder)
  .post("/resourcedetails/copy",assetRecord,controller.copyResourceDetails)
  .post("/resourcedetails/txnref", controller.txnList)
  .post("/resourcedetails/updatetxn", controller.updateTxn);

