import * as fs from "fs";
import * as moment from "moment";
import commonService from "../../api/services/common.service";
import { S3STATICS_FOLDERS } from "../../common/constants";
import logger, { ILogModules, ILogOperation } from "../../logger";

export default class AppLogger {
  private initializedOn: moment.Moment;
  private lastActive: moment.Moment;

  private loggerPath: string;
  private loggFile: string;

  private fileStream: fs.WriteStream;
  private writeToConsole: boolean = false;

  private tag: string;
  private writeLogToConsole: boolean = false;
  private masks: { pattern: RegExp; replacementValue: string }[] = [];

  constructor(
    path: string,
    file: string,
    options: {
      tag?: string;
      writetoconsole?: boolean;
      maskLogs?: { pattern: RegExp; replacementValue: string }[];
    } = {
      writetoconsole: false,
      maskLogs: [],
    }
  ) {
    this.loggerPath = path;
    this.loggFile = file;

    this.initializedOn = moment();
    this.lastActive = moment();

    this.tag = options && options.tag ? options.tag : null;
    this.writeLogToConsole = options.writetoconsole;
    this.masks = options.maskLogs;

    this.initStream();
    // this.autoCloseStream();
  }

  private initStream() {
    if (this.loggerPath && !fs.existsSync(this.loggerPath)) {
      fs.mkdirSync(this.loggerPath);
    }
    if (!fs.existsSync(this.loggerPath)) {
      fs.mkdirSync(this.loggerPath);
    }
    this.fileStream =
      this.loggerPath && this.loggFile
        ? fs.createWriteStream(this.loggerPath + this.loggFile, { flags: "a" })
        : null;
  }

  private autoCloseStream() {
    setInterval(() => {
      let idleTime = this.initializedOn.diff(this.lastActive, "seconds");

      if (idleTime > 5) {
        this.closeLogger();
      }
    }, 5000);
  }

  writeOnConsole(write: boolean) {
    this.writeLogToFile(
      "info",
      `Console write properties updated to : ${write}`
    );
    this.writeToConsole = write;
  }

  writeLogToFile(type?: "info" | "error" | "warn" | "verbose", ...args: any[]) {
    try {
      // LokiService.createLog(
      //   {
      //     message: "Logs from orchestration execution",
      //     reference: "ORCHESTRATION",
      //     tag: this.tag,
      //     meta: JSON.stringify(args),
      //   },
      //   type.toUpperCase() as any
      // );

      if (this.fileStream == null) {
        this.initStream();
        this.writeLogToFile(type, args);
      } else {
        this.lastActive = moment();

        // Substring added for 1500. Large content throws Callstack error.
        let content = args.map((o) => {
          let m = typeof o == "object" ? JSON.stringify(o) : o;
          return (
            (m && m.length > 1500 ? m.substring(0, 1500).concat("...") : m) +
            "\n"
          );
        });

        let msg =
          (this.tag || "") +
          " : " +
          (type || "") +
          ` : ${moment().format("DD-MM-YYYY hh:mm:ss A")} :` +
          content +
          "\n";

        this.masks.forEach((mask) => {
          msg = msg.replace(mask.pattern, mask.replacementValue);
        });

        if (this.writeLogToConsole) {
          switch (type) {
            case "error":
              logger.error(
                null,
                ILogModules.Orchestration,
                ILogOperation.Other,
                msg
              );
              break;
            case "warn":
              logger.warn(
                null,
                ILogModules.Orchestration,
                ILogOperation.Other,
                msg
              );
              break;
            case "info":
              logger.info(
                null,
                ILogModules.Orchestration,
                ILogOperation.Other,
                msg
              );
              break;
            case "verbose":
              logger.verbose(
                null,
                ILogModules.Orchestration,
                ILogOperation.Other,
                msg
              );
              break;

            default:
              break;
          }
        }

        this.fileStream.write(msg, "utf8");
      }
    } catch (error) {
      console.log("Error with logger>>>>>>>>>>>>>>>>>>>>>>>>>>");
      console.log(error);
    }

    return this;
  }

  closeLogger(deploymentid?: number | string) {
    this.writeLogToFile(
      "info",
      "Closing logger on " + moment().format("DD MMM YYYY hh:mm:ss T")
    );
    this.fileStream.close();
    this.fileStream = null;

    if (deploymentid) {
      commonService.uploadFiletoS3(
        process.cwd() +
          "/instances/" +
          deploymentid +
          "/" +
          deploymentid +
          ".log",
        S3STATICS_FOLDERS.ORCHESTRATIONS + "/" + deploymentid + ".log"
      );
    }
  }
}
