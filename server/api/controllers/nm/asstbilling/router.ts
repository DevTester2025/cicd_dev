import * as express from "express";
import controller from "./controller";
export default express
  .Router()
  .post("/create", controller.create)
  .post("/list", controller.all)
  .post("/filter-values", controller.getFilterValues)
  .post("/resource-billing", controller.getResourceBilling)
  .get("/:id", controller.byId)
  .post("/update", controller.update)
  .post("/getdailybilling", controller.getDailyBilling)
  .post("/summary", controller.getChart);
