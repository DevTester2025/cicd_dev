import * as express from "express";
import controller from "../pipelinestatusdaily/controller";


export default express
.Router()
.get("/", controller.all)