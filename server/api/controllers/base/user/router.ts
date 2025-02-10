import * as express from "express";
import controller from "./controller";
import RouteGuard from "../../../../common/routeGuard";

export default express
  .Router()
  .post("/create", RouteGuard, controller.create)
  .post("/login", controller.login)
  .post("/verifyotp", controller.verifyOTP)
  .post("/resendotp", controller.resendOTP)
  .post("/resettotp", controller.resettotp)
  .post("/forgotpassword", controller.forgotPassword)
  .post("/resetpassword", controller.resetPassword)
  .post("/list", RouteGuard, controller.all)
  .post("/update", RouteGuard, controller.update)
  .get("/:id", RouteGuard, controller.byId);
