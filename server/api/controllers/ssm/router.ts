import * as express from "express";
import controller from "./controller";
export default express
  .Router()
  .post("/list", controller.all)
  .post("/patchmanager", controller.getAccess, controller.pmDashboard)
  .post("/inventory", controller.getAccess, controller.inventoryDashboard)
  .post("/baselines", controller.getAccess, controller.listofBaselines)
  .post("/createinventory", controller.getAccess, controller.createInventory)
  .post("/createbaseline", controller.getAccess, controller.createBaseline)
  .post("/updatebaseline", controller.getAccess, controller.updateBaseline)
  .post("/deletebaseline", controller.getAccess, controller.deleteBaseline)
  .post("/configpatching", controller.getAccess, controller.configPB)
  .post("/syncssm", controller.getAllSSMdetails)
  .post(
    "/associationstatus",
    controller.getAccess,
    controller.describeAssStatus
  )
  .post("/associations", controller.getAccess, controller.listAssociations)
  .post("/updaterole", controller.getAccess, controller.updateRole)
  .post(
    "/instanceprofiles",
    controller.getAccess,
    controller.getInstanceProfiles
  )
  .post("/synchronization", controller.getAccess, controller.getManagedNodes)
  .post("/listcommands", controller.getAccess, controller.getCommands)
  .post(
    "/command/:commandid",
    controller.getAccess,
    controller.getCommandInvocation
  )
  .post(
    "/associationexecutions/:associationid/",
    controller.getAccess,
    controller.getExecutionList
  )
  .post(
    "/association/:associationid/",
    controller.getAccess,
    controller.associationById
  )
  .post(
    "/baselines/makedefault",
    controller.getAccess,
    controller.setDefaultBaseline
  )
  .post(
    "/maintenancewindows",
    controller.getAccess,
    controller.listMaintenancewindows
  )
  .post(
    "/compliance/:instancerefid",
    controller.getAccess,
    controller.getComplianceById
  )
  .post(
    "/compliancesummary",
    controller.getAccess,
    controller.getComplianceSummary
  );
