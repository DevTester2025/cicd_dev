import AppLogger from "../../../../../../lib/logger";
import * as rl from "readline";
import * as path from "path";
var winexe = require("@droobah/winexe");
var devNull = require("./devnull");
const fs = require("fs");

import {
  ChildProcess,
  ExecException,
  execFile,
  ExecFileOptions,
  spawn,
  exec,
} from "child_process";
import { BaseEncodingOptions } from "fs";

interface execFileCallBack {
  (err: ExecException, stdout: string, stderr: string): void;
}
export default class WinExeSession {
  private userid;
  private password;
  private clientip;
  private elevated;

  constructor(userid, password, clientip, elevated) {
    this.userid = userid;
    this.password = password;
    this.clientip = "\\\\" + clientip;
    this.elevated = elevated;
  }

  private runOnWindows(
    cmd: string,
    options?: BaseEncodingOptions & ExecFileOptions,
    logger?: AppLogger,
    cb?: execFileCallBack
  ) {
    let args = [
      this.clientip,
      "-u",
      this.userid,
      "-p",
      this.password,
      "-h",
      "-accepteula",
    ];

    args = [...args, ...cmd.replace(/\s\s+/g, " ").split(" ")];

    args = args.length > 0 ? args.filter((a) => a.length > 0) : [];

    if (logger) {
      logger.writeLogToFile("info", "Running the following command");
      logger.writeLogToFile("info", args.join(" "));
    }

    if (cb) {
      let cp = spawn("paexec.exe", args, {
        cwd: process.cwd() + "/bin",
        stdio: ["ignore", "pipe", "pipe"],
      });

      var stdoutRL = rl.createInterface({
        input: cp.stdout,
        output: devNull(),
      });
      var stderrRL = rl.createInterface({
        input: cp.stderr,
        output: devNull(),
      });

      var stdout = "";
      var watchDog;

      if (options && options.timeout) {
        watchDog = setTimeout(function () {
          try {
            process.kill(cp.pid, "SIGKILL");
          } catch (e) { }
        }, options.timeout);
      }

      stdoutRL.on("line", function (data) {
        stdout += data + "\n";
        this.emit("stdout", data);
      });

      var stderr = "";

      stderrRL.on("line", function (data) {
        stderr += data + "\n";
        this.emit("stderr", data);
      });

      cp.on("error", function (err) {
        if (watchDog) {
          clearTimeout(watchDog);
        } else {
          process.kill(cp.pid, "SIGKILL");
        }
        this.emit("error", err);
      });

      cp.on("close", function (code) {
        if (watchDog) {
          clearTimeout(watchDog);
        }
        if (code !== 0) {
          cb(
            new Error("Exit code: " + code + ". " + stderr.trim()),
            stdout,
            stderr
          );
        } else {
          cb(null, stdout, stderr);
        }
      });
    } else {
      return execFile("paexec.exe", args, {
        cwd: process.cwd() + "/bin",
        ...options,
      });
    }
  }

  private runOnLinux(
    cmd: string,
    options?: BaseEncodingOptions & ExecFileOptions,
    logger?: AppLogger,
    cb?: execFileCallBack
  ) {
    let tempPath = this.clientip.replaceAll("\\", "");
    tempPath = tempPath.replaceAll(".", "");
    let srcPath = process.cwd() + "/bin/";
    fs.exists(`${srcPath}${tempPath}`, (exist) => {
      if (!exist) {
        fs.copyFile(`${srcPath}winexe`, `${srcPath}${tempPath}`, (err) => { });
      }
    });
    if (logger) {
      logger.writeLogToFile("info", "Running the following command");
      logger.writeLogToFile("info", [
        "-U",
        `${this.userid}%####`,
        String.raw`//` + this.clientip.replace("\\\\", ""),
        `'ipconfig'`,
      ]);
    }

    const winExePath = `${srcPath}${tempPath}`;
    if (cb) {
      logger.writeLogToFile("info", "Inside CB Function >>>>>>");

      let cp = exec(
        `${winExePath} -U '${this.userid}%${this.password
        }' //${this.clientip.replace("\\\\", "")} '${cmd}'`
      );

      var stdoutRL = rl.createInterface({
        input: cp.stdout,
        output: devNull(),
      });
      var stderrRL = rl.createInterface({
        input: cp.stderr,
        output: devNull(),
      });

      var stdout = "";
      var watchDog;

      if (options && options.timeout) {
        watchDog = setTimeout(function () {
          try {
            process.kill(cp.pid, "SIGKILL");
          } catch (e) { }
        }, options.timeout);
      }

      stdoutRL.on("line", function (data) {
        stdout += data + "\n";
        this.emit("stdout", data);
      });

      var stderr = "";

      stderrRL.on("line", function (data) {
        stderr += data + "\n";
        this.emit("stderr", data);
      });

      cp.on("error", function (err) {
        if (watchDog) {
          clearTimeout(watchDog);
        } else {
          process.kill(cp.pid, "SIGKILL");
        }
        this.emit("error", err);
      });

      cp.on("close", function (code) {
        if (watchDog) {
          clearTimeout(watchDog);
        }
        if (code !== 0) {
          cb(
            new Error("Exit code: " + code + ". " + stderr.trim()),
            stdout,
            stderr
          );
        } else {
          cb(null, stdout, stderr);
        }
      });
    } else {
      const fullCommand = `${winExePath} -U '${this.userid}%${this.password
        }' //${this.clientip.replace("\\\\", "")} '${cmd}'`;
      if (logger) {
        logger.writeLogToFile(
          "info",
          "Inside Else, Running the full command is"
        );
        logger.writeLogToFile(
          "info",
          `${winExePath} -U '${this.userid}%#######' //${this.clientip.replace(
            "\\\\",
            ""
          )} '${cmd}'`
        );
      }

      return exec(fullCommand);
    }
  }

  run(
    cmd: string,
    options?: BaseEncodingOptions & ExecFileOptions,
    logger?: AppLogger,
    cb?: execFileCallBack
  ): ChildProcess {
    const currentPlatform = process.platform;

    console.log("Running on platform >>>>>>>", currentPlatform);

    if (currentPlatform == "linux") {
      return this.runOnLinux(cmd, options, logger, cb);
    }
    if (currentPlatform == "win32") {
      return this.runOnWindows(cmd, options, logger, cb);
    }
  }
}
