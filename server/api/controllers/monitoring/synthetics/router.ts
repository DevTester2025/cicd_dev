import * as express from "express";
import createController from "./create";
import getController, { getById, getRunArtifacts, getAllList, getDetails,getMonitoring } from "./get";
import deleteController from "./delete";

export default express
  .Router()
  .get("/", getController)
  .post("/list", getAllList)
  .get("/:id", getById)
  .delete("/delete/:id", deleteController)
  .post("/:id/artifacts", getRunArtifacts)
  .post("/monitoring/list", getMonitoring)
  .post("/create", createController)
  .post("/detail/list", getDetails);
