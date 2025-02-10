import axios from "axios";
import db from "../models/model";
import { Op } from "sequelize";
import * as moment from "moment";

export class AlertService {
  deleteSilence(id) {
    try {
      let promise = new Promise<any>(
        async (resolve: Function, reject: Function) => {
          let windowData: any = await db.MaintwindowMap.findAll({
            where: {
              id
            }
          });
          if (windowData.length > 0) {
            windowData = JSON.parse(JSON.stringify(windowData))[0];
            if (windowData.metadata) {
              let metadata = JSON.parse(windowData.metadata);
              for (var window of metadata) {
                let url = `${process.env.GRAFANA_ENDPOINT}${process.env.DELETE_SILENCES}${window}`;
                const alerts_data = await axios.delete(url, {
                  headers: {
                    Authorization: `${process.env.GRF_TOKEN}`
                  },
                }).catch((e) => {
                  console.log("Error in deleting silence");
                });
              }
            }
          }
          resolve("Done");
        }
      );
      return promise;
    } catch (e) {
      console.log("Error while getting snow url");
    }
  }
  createSilence(id, alert_type) {
    try {
      let weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      let promise = new Promise<any>(
        async (resolve: Function, reject: Function) => {
          let alert: any = await db.AlertConfigs.find({ where: { id } });
          alert = JSON.parse(JSON.stringify(alert));
          let windowData: any = await db.MaintwindowMap.findAll({
            where: {
              txntype: alert_type,
              txnid: id,
              status: "Active",
              notes: { [Op.ne]: "Created" }
            },
            include: [
              {
                model: db.MaintWindow,
                as: "maintwindow",
              }]
          });
          if (windowData && windowData.length > 0) {
            windowData = JSON.parse(JSON.stringify(windowData));
            let window = windowData[0];
            if (window.maintwindow && alert) {
              let maintwindow = window.maintwindow;
              let dates = await this.calculateDate(maintwindow);
              if (dates.length !== 0) {
                let silenceIDs = await this.createGrafanaSilence(dates, weekdays, alert, maintwindow, window.createdby, window.id);
              } else {
                console.log("No Dates were found !")
              }
            }
          }
          resolve("Done");
        }
      );
      return promise;
    } catch (e) {
      console.log("Error while getting snow url");
    }
  }
  createGrafanaSilence(dates, weekdays, alert, maintwindow, createdby, id) {
    let silenceIDs = [];
    findDate(0);
    async function findDate(index) {
      let date = dates[index];
      if (!date) {
        db.MaintwindowMap.update({ metadata: JSON.stringify(silenceIDs), notes: "Created" }, { where: { id } });
        return true;
      }
      let weekday = weekdays[new Date(date).getDay()];
      if (weekday && maintwindow[weekday]) {
        let silenceObj = {
          "startsAt": new Date(`${date} ${maintwindow[weekday].start}`).toISOString(),
          "endsAt": new Date(`${date} ${maintwindow[weekday].end}`).toISOString(),
          "comment": maintwindow.windowname,
          "createdBy": createdby,
          "matchers": [
            {
              "name": "name",
              "value": alert.title,
              "isEqual": true,
              "isRegex": false
            }
          ]
        };
        let url = `${process.env.GRAFANA_ENDPOINT}${process.env.GRF_SILENCES}`;
        const alerts_data = await axios.post(url, silenceObj, {
          headers: {
            Authorization: `${process.env.GRF_TOKEN}`,
          },
        });
        silenceIDs.push(alerts_data.data.silenceID);
        index = index + 1;
        findDate(index);
      } else {
        index = index + 1;
        findDate(index);
      }
    }
  }
  calculateDate(maintwindow) {
    let dates: any = [];
    let currDate = moment(maintwindow.startdate);
    let lastDate = moment(maintwindow.enddate);
    if (currDate.isBefore(moment())) { console.log("Start date range is not valid"); currDate = moment() };
    if (lastDate.isBefore(moment())) { console.log("date range is not valid"); return [] };
    let now = currDate.clone();
    while (now.isSameOrBefore(lastDate)) {
      dates.push(now.format('YYYY-M-D'));
      now.add(1, 'days');
    }
    dates.push(now.format('YYYY-M-D'));
    return dates;
  }
}
export default new AlertService();
