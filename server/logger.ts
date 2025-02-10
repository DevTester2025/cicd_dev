import db from "./api/models/model";
import { format } from "date-fns";

export enum ILogModules {
  Orchestration = "Orchestration",
  Synthetics = "Synthetics",
}

export enum ILogOperation {
  Create = "Create",
  Update = "Update",
  Delete = "Delete",
  List = "List",
  Other = "Other",
}

export enum ReferenceType {}

interface ILogContext {
  notes: string;
  _reference?: string | number;
  referencetype?: ReferenceType;
  _tenant?: number;
  meta?: string | Record<string, any>;
  status?: "Active" | "Hidden";
}

export class Logger {
  tenant: number;
  printToConsole: boolean;

  constructor(
    tenantid: number,
    options: {
      printToConsole?: boolean;
    } = {
      printToConsole: true,
    }
  ) {
    this.tenant = tenantid;
    this.printToConsole = options.printToConsole;
  }

  private async log(
    level: "verbose" | "error" | "warn" | "info",
    user: number | null,
    module: ILogModules,
    operation: ILogOperation,
    context?: ILogContext | string
  ) {
    try {
      if (this.printToConsole) {
        const msg = `${level} : (${module} : ${operation}) : ${format(
          new Date(),
          "dd MMM yyyy hh:mm:ss"
        )} : ${typeof context == "string" ? context : context.notes}`;

        switch (level) {
          case "error":
            console.error(msg);
            break;
          case "warn":
            console.warn(msg);
            break;
          case "info":
            console.info(msg);
            break;
          case "verbose":
            console.log(msg);
            break;

          default:
            break;
        }
      }
      const meta =
        typeof context == "string"
          ? null
          : typeof context.meta == "string"
          ? context.meta
          : JSON.stringify(context.meta);
      await db.Logs.create({
        _tenant: this.tenant,
        _user: user,
        createddt: new Date(),
        module,
        operation,
        level,
        ...(typeof context == "string" ? { notes: context } : context),
        meta,
      });
    } catch (error) {
      console.warn("⚠️⚠️⚠️ Error saving logs ⚠️⚠️⚠️");
      console.error(error);
    }
  }

  verbose(
    user: number | null,
    module: ILogModules,
    operation: ILogOperation,
    context?: ILogContext | string
  ) {
    this.log("verbose", user, module, operation, context);
  }

  error(
    user: number | null,
    module: ILogModules,
    operation: ILogOperation,
    context?: ILogContext | string
  ) {
    this.log("error", user, module, operation, context);
  }

  warn(
    user: number | null,
    module: ILogModules,
    operation: ILogOperation,
    context?: ILogContext | string
  ) {
    this.log("warn", user, module, operation, context);
  }

  info(
    user: number | null,
    module: ILogModules,
    operation: ILogOperation,
    context?: ILogContext | string
  ) {
    this.log("info", user, module, operation, context);
  }
}

const logger = new Logger(7);

export default logger;
