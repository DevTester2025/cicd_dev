import * as express from "express";
import controller from "./controller";
import orchRunner, { getInstancesByFilter } from "./run";

import { getSchedules, updateSchedule, deleteSchedule } from "./schedule";
import { getHeaders } from "./header";
import { getLogs } from "./logs";

export default express
  .Router()
  .post("/create", controller.create)
  .post("/update", controller.update)
  .post("/list", controller.all)
  .post("/run", orchRunner)
  .get("/:id", controller.byId)
  .post("/logs/list", getLogs)
  .post("/dry-run", getInstancesByFilter)
  .post("/schedule/list", getSchedules)
  .post("/schedule/header/list", getHeaders)
  .post("/schedule/update/:id", updateSchedule)
  .delete("/schedule/delete/:id", deleteSchedule);
