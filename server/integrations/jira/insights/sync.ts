import axios from "axios";
import Store from "../../../common/store";
import { IObjectSchema, Objectschema } from "./interface";

import ObjectSchema from "./sync/objectschema";

const epSchemeList = "/objectschema/list";

const strObjectSchemas = "object_schemas";

export default class Sync {
  host: string;
  basicAuth: string;
  tenantid: number;

  store: Store<Record<string, any>>;

  constructor(tenantid: number, host: string, auth: string) {
    this.host = host;
    this.basicAuth = auth;
    this.tenantid = tenantid;

    this.store = new Store("jira-insights-sync");
  }

  init() {
    this.getAllObjectSchemas();
  }

  private async getAllObjectSchemas() {
    try {
      const { data } = await axios.get<IObjectSchema>(
        this.host + epSchemeList,
        {
          headers: {
            Authorization: "Basic " + this.basicAuth,
          },
        }
      );

      this.store.upsert(strObjectSchemas, data.objectschemas);

      this.processObjectSchema();
    } catch (error) {
      console.info("Error while getting object schemas list");
      console.error(error);
    }
  }

  private processObjectSchema() {
    const availSchemas = this.store.get<Objectschema[]>(strObjectSchemas);
    const currentSchema = availSchemas.pop();

    this.store.upsert(strObjectSchemas, availSchemas);

    if (currentSchema) {
      this.startProcessingSchema(currentSchema);
    } else {
      console.log("-----------------------------------------------");
      console.log("Find errors if any exists.");
      console.log(JSON.stringify(this.store.get("ERR")));
      console.log("Jira sync complete 🔄👌");
    }
  }

  private startProcessingSchema(schema: Objectschema) {
    console.log(`> Starting to process "ObjectSchema" ${schema.name}`);
    const objSchemaSync = new ObjectSchema(this);
    objSchemaSync.init(schema);
    objSchemaSync.on("done", (e) => {
      console.log(
        `> Object schema sync done for "ObjectSchema" ${schema.name}`
      );
      this.processObjectSchema();
    });
  }
}
