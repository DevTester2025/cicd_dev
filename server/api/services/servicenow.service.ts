import axios from "axios";
import db from "../models/model";

export class ServicenowService {
  createSNOWTicket(obj) {
    try {
      let promise = new Promise<any>(
        async (resolve: Function, reject: Function) => {
          db.LookUp.findAll({
            where: {
              lookupkey: "TN_INT",
              keyname: { $in: ["snow-url", "snow-auth"] },
              tenantid: 7,
              status: "Active",
            },
          }).then((snowData) => {
            if (snowData != undefined) {
              const snowurl = snowData.find(
                (o: any) => o.keyname == "snow-url"
              );
              const credentials = snowData.find(
                (o: any) => o.keyname == "snow-auth"
              );
              let data = {
                impact: obj.impact,
                urgency: obj.urgency,
                short_description: obj.title,
                opened_at: obj.incidentdate,
                sys_created_on: new Date(),
                incident_state: obj.incidentstatus,
              };
              if (obj.resolution_ts) data["resolved_at"] = obj.resolution_ts;
              if (obj.incidentclosedt) data["closed_at"] = obj.incidentclosedt;
              if (obj.u_customer) data["u_customer"] = obj.u_customer;
              data["u_customer_environment_exist"] = false;
              if (obj.product) data["u_product"] = obj["product"];
              if (obj.category) data["category"] = obj["category"];
              if (obj.subcategory) data["subcategory"] = obj["subcategory"];
              if (obj.severity) data["severity"] = obj["severity"];
              if (obj.description) data["description"] = obj["description"];
              if (obj.contacttype) data["contact_type"] = obj["contacttype"];
              if (obj.assignmentgroup)
                data["assignment_group"] = obj["assignmentgroup"];
              if (obj.assignmentto) data["assignment_to"] = obj["assignmentto"];

              console.log(data);
                axios
                  .post(snowurl["keyvalue"], data, {
                    auth: JSON.parse(credentials["keyvalue"]),
                  })
                  .then((res) => {
                    if (res.status == 201) {
                      console.log("Incident created successfully>>>>>>>>>>>>");
                      resolve(res.data);
                    } else {
                      reject(res.data);
                    }
                  })
                  .catch((err) => {
                    console.log("Error on incident creation>>>>>>>>>>>>");
                    console.log(err);
                    reject(err);
                  });
            }
          });
        }
      );
      return promise;
    } catch (e) {
      console.log("Error while getting snow url");
    }
  }
}
export default new ServicenowService();
