import * as _ from "lodash";
import { constants } from "../../common/constants";
import CommonService from "../services/common.service";
import db from "../models/model";

export class notificationWatchListService {
  constructor() {}
  async createWatchList(ntfcsetupids, data) {
    try {
      const ntfcSetupObj = [];
      const existingRecords = await db.WatchList.findAll({
        where: {
          refid: data.id,
          reftype: data["pipelinename"]
        }
      });
      if (existingRecords.length > 0) {
        await CommonService.delete(
          { refid: data.id, reftype: data["pipelinename"] },
          db.WatchList
        );
      }
      for (const ntfcsetupid of ntfcsetupids) {
        const ntfcObj = {
          ntfcsetupid: ntfcsetupid,
          refid: data["id"],
          reftype: data["pipelinename"],
          tenantid: data["tenantid"],
          status: constants.STATUS_ACTIVE,
          createdby: data["createdby"],
          createddt: new Date(),
          lastupdatedby: null,
          lastupdateddt: null,
        };
        ntfcSetupObj.push(ntfcObj);
      }
      await CommonService.bulkCreate(ntfcSetupObj, db.WatchList);
    } catch (error) {
      console.log(`Failed to create WatchList`, error);
    }
  }

  async createWatchListSRM(ntfcsetupids, data) {
    try {
      const ntfcSetupObj = [];
      const existingRecords = await db.WatchList.findAll({
        where: {
          refid: data.srvrequestid,
          reftype: data["subject"]
        }
      });
      if (existingRecords.length > 0) {
        await CommonService.delete(
          { refid: data.srvrequestid, reftype: data["subject"] },
          db.WatchList
        );
      }
      for (const ntfcsetupid of ntfcsetupids) {
        const ntfcObj = {
          ntfcsetupid: ntfcsetupid,
          refid: data["srvrequestid"],
          reftype: data["subject"],
          tenantid: data["tenantid"],
          status: constants.STATUS_ACTIVE,
          createdby: data["createdby"],
          createddt: new Date(),
          lastupdatedby: null,
          lastupdateddt: null,
        };
        ntfcSetupObj.push(ntfcObj);
      }
      await CommonService.bulkCreate(ntfcSetupObj, db.WatchList);
    } catch (error) {
      console.log(`Failed to create WatchList`, error);
    }
  }
  async createWatchListWP(ntfcsetupids, dataArray) {
    try {
      const ntfcSetupObj = [];
      for (const data of dataArray) {
        // Check for existing records for each data object in the array
        const existingRecords = await db.WatchList.findAll({
          where: {
            refid: data.resourceid,
            reftype: data.crn,
          },
        });
  
        // Delete existing records if found
        if (existingRecords.length > 0) {
          await CommonService.delete(
            { refid: data.resourceid, reftype: data.crn },
            db.WatchList
          );
        }
  
        // Loop through each ntfcsetupid and prepare objects for WatchList entries
        for (const ntfcsetupid of ntfcsetupids) {
          const ntfcObj = {
            ntfcsetupid: ntfcsetupid,
            refid: data.resourceid,
            reftype: data.crn,
            tenantid: data.tenantid,
            status: constants.STATUS_ACTIVE,
            createdby: data.createdby,
            createddt: new Date(),
            lastupdatedby: null,
            lastupdateddt: null,
          };
          ntfcSetupObj.push(ntfcObj);
        }
      }
  
      // Bulk create all entries after looping through the entire data array
      await CommonService.bulkCreate(ntfcSetupObj, db.WatchList);
    } catch (error) {
      console.log(`Failed to create WatchList`, error);
    }
  }


  
}
export default new notificationWatchListService();
