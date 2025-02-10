import axios from "axios";
import * as events from "events";
import { IObjectType, Objectschema } from "../interface";
import Sync from "../sync";
import ObjectType from "./objecttypes";

const epObjectTypesListFlat = "/objectschema/{{schemaid}}/objecttypes/flat";

const strObjectTypes = "object_types";

export default class ObjectSchema {
  e: events.EventEmitter;
  sync: Sync;

  constructor(sync: Sync) {
    this.sync = sync;
    this.e = new events.EventEmitter();
  }

  init(schema: Objectschema) {
    this.getAllObjectTypes(schema);
  }

  private async getAllObjectTypes(schema: Objectschema) {
    try {
      const { data } = await axios.get<IObjectType[]>(
        this.sync.host +
          epObjectTypesListFlat.replace("{{schemaid}}", schema.id.toString()),
        {
          headers: {
            Authorization: "Basic " + this.sync.basicAuth,
          },
        }
      );

      this.sync.store.upsert(strObjectTypes, data);
      this.processObjectSchema();
    } catch (error) {
      console.info("Error while getting object types list");
      console.error(error);
    }
  }

  private processObjectSchema() {
    const availObjectTypes = this.sync.store.get<IObjectType[]>(strObjectTypes);
    const currentObjectType = availObjectTypes.pop();

    this.sync.store.upsert(strObjectTypes, availObjectTypes);

    if (currentObjectType) {
      // if (currentObjectType.name == "Deviation") {
      //   console.error(">> SKIPPED DEVIATION");
      //   this.processObjectSchema();
      // } else {
      this.startProcessingObjectType(currentObjectType);
      // }
    } else {
      this.e.emit("done", "*** Processed all object types ***");
    }
  }

  private async startProcessingObjectType(objectType: IObjectType) {
    console.log(`>> Sync started for "ObjectType" ${objectType.name}`);
    const objectTypeSync = new ObjectType(this);
    objectTypeSync.init(objectType);
    objectTypeSync.on("done", (e) => {
      console.log(`>> Sync done for "ObjectType" ${objectType.name}`);
      this.processObjectSchema();
    });
  }

  on(type: "done", handler: (...args: any[]) => void) {
    this.e.addListener(type, handler);
  }
}
