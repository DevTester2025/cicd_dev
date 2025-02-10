import { constants } from "../../../../../../common/constants";
import { NodeSSH } from "node-ssh";

export class Shell {
  sessions = {} as any;
  storeSession(key, value) {
    this.sessions[key] = value;
  }
  getSession(key) {
    return this.sessions[key];
  }
  executecmd(params, retries, key, orchUtils, cmd?) {
    orchUtils.logger.writeLogToFile("info", " Start of command execution ");
    orchUtils.logger.writeLogToFile("info", "--" + JSON.stringify(params));
    orchUtils.logger.writeLogToFile("info", retries + "--" + key + "--" + cmd);
    return new Promise((resolve, reject) => {
      let i = 0;
      function connectToRemote() {
        i += 1;
        try {
          const ssh = new NodeSSH();
          ssh
            .connect({
              host: params.ip,
              username: params.username,
              password: params.password,
            })
            .then(function () {
              ssh
                .execCommand(cmd ? cmd : "ifconfig")
                .then(function (result) {
                  orchUtils.logger.writeLogToFile("info", " Execution result is ------------------- ");
                  orchUtils.logger.writeLogToFile("info", JSON.stringify(result.stdout ? result.stdout : result.stderr));
                  console.log(result, "color:green;");
                  if (result.stdout) {
                    resolve({ continue: true, params, key });
                  } else if (result.stderr) {
                    reject(JSON.stringify(result.stderr));
                  } else {
                    resolve({ continue: true, params, key });
                  }
                })
                .catch((e) => {
                  retry(String(e));
                });
            })
            .catch((e) => {
              retry(String(e));
            });
        } catch (e) {
          retry(String(e));
        }
      }
      function retry(err: string) {
        orchUtils.logger.writeLogToFile(
          "info",
          "Connection to remote machine failed " + i
        );
        orchUtils.logger.writeLogToFile("info", " error is ------------------- ");
        orchUtils.logger.writeLogToFile("info", JSON.stringify(err));
        if (i == retries) {
          reject({ err: true, message: err });
        } else {
          setTimeout(() => {
            connectToRemote();
          }, 20000);
        }
      }
      connectToRemote();
    });
  }

  scriptExecution(params, key, orchUtils, filename, args) {
    return new Promise((resolve, reject) => {
      let installwget = "yum -y install wget";
      orchUtils.logger.writeLogToFile("info", "Params are " + params);
      orchUtils.logger.writeLogToFile("info", "Args are " + args);
      orchUtils.logger.writeLogToFile("info", params + " " + installwget);
      this.executecmd(params, 10, key, orchUtils, installwget)
        .then((res) => {
          orchUtils.logger.writeLogToFile("info", res);
          let encryptedfile = Buffer.from(filename).toString("base64");
          let file =
            process.env.BASE_URL +
            "/cloudmatiq/aws/common/downloadfile/" +
            `${encryptedfile}`;
          orchUtils.logger.writeLogToFile("info File path", file);
          let copycmd = "wget -O " + filename + " " + file;
          orchUtils.logger.writeLogToFile("info", copycmd);
          this.executecmd(params, 10, key, orchUtils, copycmd)
            .then((res) => {
              let execmd =
                "chmod +x " + filename + "; ./" + filename + " " + args;
              orchUtils.logger.writeLogToFile("info", execmd);
              setTimeout(() => {
                this.executecmd(params, 10, key, orchUtils, execmd)
                  .then((res) => {
                    resolve(res);
                  })
                  .catch((e) => {
                    orchUtils.logger.writeLogToFile(
                      "error",
                      "Error in shell exe " + e
                    );
                    reject(e);
                  });
              }, 10000);
            })
            .catch((e) => {
              reject(e);
              orchUtils.logger.writeLogToFile("error", "Error in copy" + e);
            });
        })
        .catch((e) => {
          orchUtils.logger.writeLogToFile("error", "Error in wget" + e);
          reject(e);
        });
    });
  }
  restartRemoteMechine(params, key, orchUtils) {
    return new Promise((resolve, reject) => {
      let installwget = "reboot";
      orchUtils.logger.writeLogToFile("info", "Params are " + params);
      this.executecmd(params, 10, key, orchUtils, installwget)
        .then((res) => {
          resolve(res);
        })
        .catch((e) => {
          orchUtils.logger.writeLogToFile("error", "Error in wget" + e);
          reject(e);
        });
    });
  }
}
export default new Shell();
