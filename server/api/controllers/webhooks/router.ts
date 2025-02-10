import * as express from "express";
import hookHandler, { orchestrationAprroval, log, manualAprroval } from "./controller";
import webhookHandler from "./handler";

export default express
  .Router()
  .post("/hook", hookHandler)
  .put("/webhook/:module/:type", webhookHandler)
  .post("/webhook/:module/:type", webhookHandler)
  .post("/webhook/:provider", log)
  .post("/orch/webhook", orchestrationAprroval)
  .post("/manualapproval/webhook", manualAprroval);

