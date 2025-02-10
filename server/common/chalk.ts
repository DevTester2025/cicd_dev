import chalk from "chalk";

const writeLog = console.log;

class WriteLog {
  static info(...args: any[]) {
    writeLog(chalk.bgGreenBright.whiteBright("Info : "), ...args);
  }
  static error(...args: any[]) {
    writeLog(chalk.bgRed.whiteBright("Error : "), ...args);
  }
  static warning(...args: any[]) {
    writeLog(chalk.bgMagentaBright.white("Warning : "), ...args);
  }
}

export default WriteLog;
