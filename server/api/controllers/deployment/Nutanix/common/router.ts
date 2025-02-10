import * as express from "express";
import controller from "./controller";

export default express
  .Router()
  .post("/datacenters", controller.bulkCreateDC)
  .post("/hosts", controller.bulkCreateHosts)
  .post("/clusters", controller.bulkCreateClusters)
  .post("/instances", controller.bulkCreateVM)
  .get("/hosts", controller.getAllHosts)
  .get("/datacenters", controller.getAllDc)
  .get("/instances", controller.getAllVM)
  .get("/clusters", controller.getAllClusters)
  .delete("/cluster/:param", controller.deleteCluster)
  .delete("/host/:param", controller.deleteHost)
  .delete("/datacenter/:param", controller.deleteDc)
  .delete("/instance/:param", controller.deleteVm)
  .get("/host/:param", controller.getHost)
  .get("/cluster/:param", controller.getCluster)
  .get("/datacenter/:param", controller.getDc)
  .get("/instance/:param", controller.getVm)
  .put("/cluster/:param", controller.updateCluster)
  .put("/datacenter/:param", controller.updateDC)
  .put("/host/:param", controller.updateHost)
  .put("/instance/:param", controller.updateVM);
