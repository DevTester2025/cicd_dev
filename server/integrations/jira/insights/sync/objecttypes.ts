import axios from "axios";
import * as events from "events";

import db from "../../../../api/models/model";
import { IObjectType, IObjectTypeAttribute } from "../interface";
import Objects from "./object";
import ObjectSchema from "./objectschema";

const epObjectTypeAttributes = "/objecttype/{{objectid}}/attributes";

let counter = 0;

export default class ObjectType {
  schema: ObjectSchema;
  objectTypeData: IObjectType;
  e: events.EventEmitter;

  constructor(schema: ObjectSchema) {
    this.schema = schema;
    this.e = new events.EventEmitter();
  }

  init(objectType: IObjectType) {
    this.objectTypeData = objectType;
    this.getAllObjectTypeAttributes(objectType);
  }

  private async getAllObjectTypeAttributes(objectType: IObjectType) {
    try {
      const { data } = await axios.get<IObjectTypeAttribute[]>(
        this.schema.sync.host +
          epObjectTypeAttributes.replace(
            "{{objectid}}",
            objectType.id.toString()
          ),
        {
          headers: {
            Authorization: "Basic " + this.schema.sync.basicAuth,
          },
        }
      );

      console.log(
        `>>> Started pulling "ObjectType" attributes ${objectType.name}`
      );
      this.processFieldKeys(data);
    } catch (error) {
      console.info("Error while getting object types list");
      console.error(error);
    }
  }

  private processFieldKeys(attributesLists: IObjectTypeAttribute[]) {
    let fields = [];

    attributesLists.forEach((a) => {
      let fieldType = null;
      let relation = null;

      const crn =
        "crn:ops:" +
        a.objectType.name.toLowerCase().replace(/[^A-Z0-9]+/gi, "_");

      if (a.defaultType == undefined && a.referenceType) {
        fieldType = "REFERENCE";
        relation =
          "crn:ops:" +
          a.referenceObjectType.name.toLowerCase().replace(/[^A-Z0-9]+/gi, "_");
      } else if (a.defaultType == undefined && a.referenceType == undefined) {
        fieldType = "STATUS";
      } else {
        fieldType = a && a.defaultType ? a.defaultType.name : null;
      }

      fields.push({
        resourcetype: a.objectType.name,
        crn: crn,
        fieldkey:
          `${crn}/fk:` + a.name.toLowerCase().replace(/[^A-Z0-9]+/gi, "_"),
        fieldname: a.name,
        fieldtype: fieldType,
        protected: null,
        defaultval: a.options,
        showbydefault: 0,
        status: "Active",
        createdby: "SYSTEM",
        createddt: new Date(),
        lastupdatedby: "SYSTEM",
        lastupdateddt: new Date(),
        tenantid: this.schema.sync.tenantid,
        meta: JSON.stringify(a),
        relation,
      });
    });

    console.log(
      `>>> Done processing attributes for "ObjectType" ${this.objectTypeData.name}`
    );
    db.AssetsHdr.bulkCreate(fields)
      .then(() => {
        const obj = new Objects(this);
        obj.init();
        obj.on("done", () => {
          console.log(
            `>>> All "Objects" for "ObjectType" ${this.objectTypeData.name} has been migrated.`
          );
          this.e.emit("done", fields);
          //   console.log(
          //     "ADDED ALL OBJECT OF OBJECT TYPE " + this.objectTypeData.name
          //   );
          //   if (counter < 10) {
          //     counter += 1;
          //     this.e.emit("done", fields);
          //   } else {
          //     console.log(`Added ${counter} ObjectTypes`);
          //   }
        });
      })
      .catch((err) => {
        console.error("ERROR CREATING FIELDS >>>>");
        console.error(err);
      });
  }

  on(type: "done", handler: (...args: any[]) => void) {
    this.e.addListener(type, handler);
  }
}
