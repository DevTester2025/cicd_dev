import CommonService from "../../../services/common.service";
import axios from "axios";
const https = require("https");
import db from "../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import { constants } from "../../../../common/constants";
import _ = require("lodash");
import { modules } from "../../../../common/module";

export class Controller {
  constructor() {}

  getData(req: Request, res: Response) {
    let response = { reference: modules.WAZHU };
    const instance = axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });
    const Assets = {
      Package: `/syscollector/{{agentid}}/packages`,
      Process: `/syscollector/{{agentid}}/processes`,
      Network: `/syscollector/{{agentid}}/netiface`,
      Ports: `/syscollector/{{agentid}}/ports`,
      NetworkSettings: `/syscollector/{{agentid}}/netaddr`,
      States_Agent: `/agents/{{agentid}}/stats/agent?wait_for_complete=${true}`,
      States_Interval: `/agents/{{agentid}}/stats/logcollector?wait_for_complete=${true}`,
      SCA_Total: `/sca/{{agentid}}`,
      SCA_List: `/sca/{{agentid}}/checks/sca_win_audit`,
    };
    // new Controller()
    //   .getToken(instance, req.body)
    //   .then((wazuhData) => {
    let wazuhData = req.body.wazuhdata;
    if (wazuhData) {
      let url = wazuhData.url + Assets[req.body.type];
      url = url.replace("{{agentid}}", req.body.agentid);
      instance
        .get(url, {
          headers: {
            Authorization: `Bearer ${wazuhData.token}`,
          },
        })
        .then((data: any) => {
          // FIXME: TAGUPDATE
          console.log(data.status);
          customValidation.generateSuccessResponse(
            data && data.data ? data.data : {},
            response,
            constants.RESPONSE_TYPE_LIST,
            res,
            req
          );
        })
        .catch((e) => {
          console.log("Catch", e);
          customValidation.generateFailureResponse(
            e,
            constants.RESPONSE_TYPE_LIST,
            res,
            req
          );
        });
    } else {
      customValidation.generateFailureResponse(
        response,
        constants.RESPONSE_TYPE_LIST,
        res,
        req
      );
    }
  }

  getfile(req: Request, res: Response) {
    let key = req.params.key;
    if (req.params.key.match("/sync_assets/") != null) {
      key = "Assetsync/" + req.params.key;
    }
    if (req.query.type) {
      key = req.query.type + "/" + req.params.key;
    }
    CommonService.readS3File(key)
      .then((resp) => {
        res.send(resp);
      })
      .catch((error) => {
        res.send(error);
      });
  }

  getAgent(req: Request, res: Response) {
    let response = { reference: modules.WAZHU };
    const instance = axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });
    // let ipaddr = req.body.ipaddr;
    let ipaddr = req.body.ipaddr;
    let name = req.body.instancename;
    new Controller()
      .getToken(instance, req.body)
      .then((wazuhData) => {
        console.log("103:", wazuhData);
        instance
          .get(wazuhData.url + `/agents?name=${name}`, {
            headers: {
              Authorization: `Bearer ${wazuhData.token}`,
            },
          })
          .then((data: any) => {
            if (data && data.data && data.data.data.total_affected_items != 0) {
              customValidation.generateSuccessResponse(
                data.data,
                response,
                constants.RESPONSE_TYPE_LIST,
                res,
                req
              );
            } else {
              new Controller()
                .getToken(instance, req.body)
                .then((wazuhData) => {
                  console.log(wazuhData);
                  instance
                    .get(wazuhData.url + `/agents?ip=${ipaddr}`, {
                      headers: {
                        Authorization: `Bearer ${wazuhData.token}`,
                      },
                    })
                    .then((data: any) => {
                      customValidation.generateSuccessResponse(
                        data.data,
                        response,
                        constants.RESPONSE_TYPE_LIST,
                        res,
                        req
                      );
                    });
                });
            }
          });
      })
      .catch((e) => {
        customValidation.generateFailureResponse(
          response,
          constants.RESPONSE_TYPE_LIST,
          res,
          req
        );
      });
  }
  getAuthentication(req: Request, res: Response) {
    let response = { reference: modules.WAZHU };
    const instance = axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });
    new Controller()
      .getToken(instance, req.body)
      .then((wazuhData) => {
        customValidation.generateSuccessResponse(
          wazuhData,
          response,
          constants.RESPONSE_TYPE_LIST,
          res,
          req
        );
      })
      .catch((e) => {
        customValidation.generateFailureResponse(
          response,
          constants.RESPONSE_TYPE_LIST,
          res,
          req
        );
      });
  }
  getToken(instance, data): Promise<any> {
    return new Promise((resolve, reject) => {
      CommonService.getAllList(
        {
          where: {
            tenantid: data.tenantid,
            lookupkey: constants.LOOKUPKEYS.WAZUH_CRED,
          },
        },
        db.LookUp
      ).then((credentials) => {
        console.log(credentials)
        let url = credentials.find((el) => {
          return el.keyname == constants.LOOKUPKEYS.WAZUH_API_URL;
        });
        let username = credentials.find((el) => {
          return el.keyname == constants.LOOKUPKEYS.WAZUH_USERNAME;
        });
        let passsword = credentials.find((el) => {
          return el.keyname == constants.LOOKUPKEYS.WAZUH_PASSWORD;
        });
        instance
          .get(url.keyvalue + "/security/user/authenticate?raw=true", {
            auth: {
              username: username.keyvalue,
              password: passsword.keyvalue,
            },
          })
          .then((cred) => {
            console.log(cred)
            resolve({ token: cred.data, url: url.keyvalue });
          })
          .catch((e) => {
            console.log(e)
            reject(e);
          });
      }).catch((e) => {
        console.log(e)
        reject(e);
      });
    });
  }
  updateWazuhAgent(req: Request, res: Response){
    let response = { reference: modules.WAZHU };
    const instance = axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });
    // let ipaddr = req.body.ipaddr;
    let ipaddr = req.body.ipaddr;
    let name = req.body.instancename;
    new Controller()
      .getToken(instance, req.body)
      .then((wazuhData) => {
        instance
          .get(wazuhData.url + `/agents?name=${name}`, {
            headers: {
              Authorization: `Bearer ${wazuhData.token}`,
            },
          })
          .then((data: any) => {
            if (data && data.data && data.data.data.total_affected_items != 0) {
              customValidation.generateSuccessResponse(
                data.data,
                response,
                constants.RESPONSE_TYPE_LIST,
                res,
                req
              );
            } else {
              new Controller()
                .getToken(instance, req.body)
                .then((wazuhData) => {
                  instance
                    .get(wazuhData.url + `/agents?ip=${ipaddr}`, {
                      headers: {
                        Authorization: `Bearer ${wazuhData.token}`,
                      },
                    })
                    .then((data: any) => {
                      customValidation.generateSuccessResponse(
                        data.data,
                        response,
                        constants.RESPONSE_TYPE_LIST,
                        res,
                        req
                      );
                    });
                });
            }
          });
      })
      .catch((e) => {
        customValidation.generateFailureResponse(
          response,
          constants.RESPONSE_TYPE_LIST,
          res,
          req
        );
      });
  }
}
export default new Controller();
