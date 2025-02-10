import * as express from "express";
import controller from './controller';
export default express
  .Router()
  .post("/create", controller.create)
  .get("/", controller.all)
  .get("/:id", controller.byId)
  .post("/update/:id",controller.update)
  
  
