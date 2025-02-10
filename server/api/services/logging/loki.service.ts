import * as _ from "lodash";
import winston = require("winston");
const logger = winston.createLogger();
const LokiTransport = require("winston-loki");
import * as os from "os";
export class LokiService {
  constructor() {
    logger.add(
      new LokiTransport({
        name: "loki",
        host: "https://logs-prod-eu-west-0.grafana.net",
        json: true,
        basicAuth: process.env.LOKI_USER + ":" + process.env.LOKI_KEY,
        labels: { job: "cm-loki-logging" },
      })
    );
  }
  createLog(data, level: "ERROR" | "INFO" | "WARN" | "DEBUG", request?) {
    const environment = process.env.APP_ENV;

    if (environment != "prod") {
      let logObj = {
        timestamp: new Date(),
        deviceosversion: os.release(),
        filename: data.filename,
        deviceid: os.hostname(),
        deviceos: os.type(),
        environment: process.env.BASE_URL,
        codebase: "CM-API",
        level: level,
        reference: data.reference,
        tag: data.tag,
        meta:
          data.meta && typeof data.meta == "string"
            ? data.meta
            : data.meta
            ? JSON.stringify(data.meta)
            : null,
        request: JSON.stringify({}),
        response: JSON.stringify(_.omit(data, ["data"])),
      } as any;
      if (request) {
        logObj.request = request;
      }
      if (data.request) {
        logObj.request = JSON.stringify(data.request);
      }
      if (level == "WARN") {
        logger.warn({
          message: data.message,
          labels: logObj,
        });
      }
      if (level == "INFO") {
        logger.info({
          message: data.message,
          labels: logObj,
        });
      }
      if (level == "ERROR") {
        logger.error({
          message: data.message,
          labels: { ...logObj, code: data.code, error: data.error },
        });
      }
      if (level == "DEBUG") {
        logger.debug({
          message: data.message,
          labels: { key: "test" },
        });
      }
    }
  }
}
export default new LokiService();
