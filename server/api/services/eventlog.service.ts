import db from "../models/model";
import commonService from "./common.service";

class EventLogService {
  constructor() {}
  insertIntoEventLog(reqobj) {
    try {
      let logObj = {} as any;
      logObj["createdby"] = reqobj["createdby"]
        ? reqobj["createdby"]
        : "SYSTEM";
      logObj["createddt"] = reqobj["createddt"]
        ? reqobj["createddt"]
        : new Date();
      commonService
        .create(logObj, db.eventlog)
        .then((event) => {
          console.log("EVENT SAVE SUCCESS");
        })
        .catch((e) => {
          console.log(e);
        });
    } catch (e) {
      console.log(e);
    }
  }
}
export default new EventLogService();
