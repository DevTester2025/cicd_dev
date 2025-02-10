
import * as express from "express";
import controller from "./controller";
export default express
  .Router()
  .post("/list", controller.getAccess, controller.all)
  .post("/description", controller.description)
  .post("/create", controller.getAccess, controller.create);