import axios from "axios";
import db from "../models/model";
import commonService from "./common.service";
import { createAwsSigner } from "sign-aws-requests";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";
import { Op } from "sequelize";
import * as _ from "lodash";

export class PrometheusService {
  getVmUptime(tenantid, params) {
    let promise = new Promise<any>(
      async (resolve: Function, reject: Function) => {
        try {
          const tntresponse = await commonService.getAllList(
            {
              where: {
                tenantid: tenantid,
                lookupkey: "TN_INT",
                keyname: "prometheus-url",
                status: "Active",
              },
            },
            db.LookUp
          );
          if (tntresponse.length > 0) {
            const url =
              tntresponse[0].keyvalue + "?query=" + encodeURIComponent(params);

            const sign = createAwsSigner({
              config: {
                service: "aps",
                region: process.env.APP_AWS_APS_REGION,
                accessKeyId: process.env.APP_AWS_APS_ACCESS,
                secretAccessKey: process.env.APP_AWS_APS_SECRET,
              },
            });

            const request = {
              url: url,
              method: "GET",
              headers: {
                "content-type": "application/json",
                Host: "aps-workspaces.eu-west-2.amazonaws.com",
              },
            };

            const { authorization, bodyString } = await sign(request as any);
            (request.headers as any).Authorization = authorization;

            axios(request as any)
              .then((response) => {
                if (response.data.status == "success") {
                  console.log(response.data);
                  resolve(response.data.data);
                } else {
                  console.error(response.data);
                  reject({ name: "", error: response.data });
                }
              })
              .catch((error) => {
                reject({ name: "", error: error });
              });
          } else {
            reject({
              name: "No Data for Montioring Agent",
              error: "No Data for Montioring Agent",
            });
          }
        } catch (e) {
          reject({ name: e, error: e });
        }
      }
    );
    return promise;
  }
  getVMStatus(tenantid, provider, params) {
    let promise = new Promise<any>(
      async (resolve: Function, reject: Function) => {
        try {
          const tntresponse = await commonService.getData(
            {
              where: {
                tenantid: tenantid,
                lookupkey: "TN_INT",
                keydesc: provider,
                status: "Active",
              },
            },
            db.LookUp
          );
          if (tntresponse) {
            let axiosarr = [];
            const url =
              tntresponse["dataValues"].keyvalue +
              `?query=${encodeURIComponent(params)}`;
            const apiUrl = new URL(url);

            const sigv4 = new SignatureV4({
              service: "aps",
              region: process.env.APP_AWS_APS_REGION,
              credentials: {
                accessKeyId: process.env.APP_AWS_APS_ACCESS,
                secretAccessKey: process.env.APP_AWS_APS_SECRET,
              },
              sha256: Sha256,
            });
            const signed = (await sigv4.sign({
              method: "GET",
              hostname: apiUrl.host,
              path: apiUrl.pathname,
              query: {
                query: params,
              },
              protocol: apiUrl.protocol,
              headers: {
                host: apiUrl.hostname, // compulsory
              },
            })) as any;
            const request = {
              ...signed,
              url,
            };
            axiosarr.push(request);
            try {
              const arr = await Promise.all(
                _.map(axiosarr, (a) => {
                  return axios(a);
                })
              );
              if (arr) {
                let list = { result: [] };
                _.map(arr, (el, i) => {
                  if (el.status == 200 && el.data.status == "success") {
                    list.result = list.result.concat(el.data.data.result);
                  }
                  if (i == arr.length - 1) {
                    resolve(list);
                  }
                });
              }
            } catch (error) {
              console.log("An error occurred >> ");
              console.log(error);
              reject({
                name: "No Data for Montioring Agent",
                error: "No Data for Montioring Agent",
              });
            }
          }
        } catch (e) {
          reject({ name: e, error: e });
        }
      }
    );
    return promise;
  }

  // Used for cummulative dashboard.
  executeQuery(baseUrl: string, query: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const url = baseUrl + `?query=${encodeURIComponent(query)}`;
      const apiUrl = new URL(url);

      const sigv4 = new SignatureV4({
        service: "aps",
        region: process.env.APP_AWS_APS_REGION,
        credentials: {
          accessKeyId: process.env.APP_AWS_APS_ACCESS,
          secretAccessKey: process.env.APP_AWS_APS_SECRET,
        },
        sha256: Sha256,
      });

      const signed = (await sigv4.sign({
        method: "GET",
        hostname: apiUrl.host,
        path: apiUrl.pathname,
        query: {
          query: query,
        },
        protocol: apiUrl.protocol,
        headers: {
          host: apiUrl.hostname, // compulsory
        },
      })) as any;

      try {
        const { data } = await axios({
          ...signed,
          url,
        });

        console.log(">>>>>>>>>>>>>>>>>>>>>>>> Response for query run");
        console.log(url);
        console.log(JSON.stringify(data));

        resolve(data);
      } catch (error) {
        console.log("An error occurred >> ");
        console.log(query);
        console.log(url);
        reject(error);
      }
    });
  }
}
export default new PrometheusService();
