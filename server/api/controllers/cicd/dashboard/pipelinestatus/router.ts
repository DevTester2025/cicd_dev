import * as express from "express";
import controller from "../pipelinestatus/controller";

export default express
.Router()
.get("/", controller.all)