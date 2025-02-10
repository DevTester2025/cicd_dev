import * as moment from "moment";
import controller from "../controllers/nm/asstutl/controller";
export class NotifyServerUtl {
  constructor() {
    this.notifyServerUtl();
  }
  // API - Server Utilisation
  notifyServerUtl() {
    console.log("Cron Job Running.................");
    controller.cronJob();
  }
}
