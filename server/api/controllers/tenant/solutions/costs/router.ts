/*
 * @Author: Vidhya M
 * @Date: 2020-07-23 12:21:15
 * @Last Modified by:   Vidhya M
 * @Last Modified time: 2020-07-23 12:21:15
 */

import * as express from "express";
import controller from "./controller";
export default express
  .Router()
  .post("/create", controller.create)
  .post("/bulkcreate", controller.bulkCreate)
  .post("/update", controller.update)
  .post("/list", controller.all)
  .get("/:id", controller.byId);
