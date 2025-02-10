import axios from "axios";

export class PagerDutyService {
  createIncident(promalertdata, alertobj) {
    try {
      let promise = new Promise<any>(
        async (resolve: Function, reject: Function) => {
          const request: any = {
            url: process.env.PD_INCIDENTAPI,
            method: "post",
            headers: {
              "content-type": "application/json",
              Authorization: process.env.PD_APIKEY,
              From :  process.env.PD_FROMEMAIL,
            },
            data: {
              incident: {
                incident_key : Math.random().toString().substr(2, 16),
                type: "incident",
                title: alertobj.title,
                service: {
                  id: process.env.PD_SERVICE_ID,
                  type: "service_reference",
                },
                urgency: alertobj.severity.toLowerCase(),
                body: {
                  type: "incident_body",
                  details: "",
                },
                escalation_policy: {
                  id: process.env.PD_POLICY_ID,
                  type: "escalation_policy_reference",
                },
              },
            },
          };
          await axios(request)
            .then((data) => {
              resolve(data);
            })
            .catch((e) => {
              reject(e);
            });
        }
      );
      return promise;
    } catch (e) {
      console.log("Error while getting snow url");
    }
  }
}
export default new PagerDutyService();
