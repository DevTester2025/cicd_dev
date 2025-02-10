import * as _ from "lodash";
import * as AWS from "@aws-sdk/client-secrets-manager";
interface SMPattern {
  customerid?: number;
  env?: "prod" | "dev" | "test"; // from process
  resourcetype: "VM" | "S3" | "SSM";
  resourcerefid: string;
  username?: string;
}
export class AWSSecretManagerService {
  constructor() {}

  getSecrets(credentials, region: string, params?) {
    var sm = new AWS.SecretsManager({
      region: region,
      credentials: credentials,
    });
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      sm.listSecrets(params, function (err, data) {
        if (err) {
          resolve({
            status: false,
            error: err.stack,
          });
        } else {
          resolve({
            status: true,
            data: data["SecretList"],
          });
        }
      });
    });

    return promise;
  }

  create(credentials, region: string, params?) {
    var sm = new AWS.SecretsManager({
      region: region,
      credentials: credentials,
    });
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      sm.createSecret(params, function (err, data) {
        if (err) {
          resolve({
            status: false,
            error: err.stack,
          });
        } else {
          resolve({
            status: true,
            data: data,
          });
        }
      });
    });

    return promise;
  }

  getSecretDesc(credentials, region: string, params) {
    var sm = new AWS.SecretsManager({
      region: region,
      credentials: credentials,
    });
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      sm.describeSecret(params, function (err, data) {
        if (err) {
          resolve({
            status: false,
            error: err.stack,
          });
        } else {
          resolve({
            status: true,
            data: data,
          });
        }
      });
    });

    return promise;
  }
  // Input : instancerefid
  // Defaults : AWS CM Credentials, CM region
  // Regex - <customerid-env>/resourcetype/<resourcerefid>/<username>
  getSecretValue(data: SMPattern): Promise<string[]> {
    console.log(data);
    return new Promise((resolve: Function, reject: Function) => {
      let region = process.env.DEFAULT_SMREGION;
      let credentials = {
        accessKeyId: process.env.APP_AWS_ACCESS,
        secretAccessKey: process.env.APP_AWS_SECRET,
      };
      var sm = new AWS.SecretsManager({
        region: region,
        credentials: credentials,
      });
      let secretId =
        data.customerid +
        "-" +
        process.env.APP_ENV +
        "/" +
        data.resourcetype +
        "/" +
        data.resourcerefid +
        "/" +
        (data.username ? data.username : "DFT");
      try {
        sm.getSecretValue({ SecretId: secretId }, function (error, value) {
          if (error) {
            reject(error);
          } else {
            let resultValues = [];

            let data = value.SecretString
              ? JSON.parse(value.SecretString)
              : null;

            resultValues = data != null ? [data.UserName, data.Password] : [];
            resolve(resultValues);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}
export default new AWSSecretManagerService();
