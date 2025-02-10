import axios from "axios";
import * as events from "events";
import { S3 } from "aws-sdk";

import {
  IAttachment,
  IIqlResponse,
  IObjectComment,
  IObjectHistory,
  IObjectType,
  ObjectEntry,
} from "../interface";
import ObjectType from "./objecttypes";
import db from "../../../../api/models/model";

const epObjectsList = "/iql/objects?iql=objectTypeId=";
const epObjectsGetAttachmentsList = "/attachments/object/";
const epObjectsGetCommentsList = "/comment/object/";
const epObjectsGetHistoryList = "/object/{{objectid}}/history";

export default class Objects {
  private objType: ObjectType;
  private objectTypeData: IObjectType;
  e: events.EventEmitter;

  private currentPage = 1;
  private totalObjects = 0;
  private objectsPerPage = 0;

  constructor(objtype: ObjectType) {
    this.objType = objtype;
    this.objectTypeData = objtype.objectTypeData;
    this.e = new events.EventEmitter();
  }

  init() {
    this.processObjects();
  }

  async processObjects() {
    try {
      let url =
        this.objType.schema.sync.host + epObjectsList + this.objectTypeData.id;

      url += `&page=${this.currentPage}`;

      let assetDetails = [];

      const { data } = await axios.get<IIqlResponse>(url, {
        headers: {
          Authorization: "Basic " + this.objType.schema.sync.basicAuth,
        },
        timeout: 1000 * 30,
      });

      this.totalObjects = data.totalFilterCount;
      this.objectsPerPage = data.pageObjectSize;
      if (data.objectEntries && data.objectEntries.length > 0) {
        data.objectEntries.forEach((o) => {
          const crn =
            "crn:ops:" +
            o.objectType.name.toLowerCase().replace(/[^A-Z0-9]+/gi, "_");
          const resourceId = crn + "/" + o.id;

          if (o.attributes && o.attributes.length > 0) {
            o.attributes.forEach((a) => {
              const attributeDetail = data.objectTypeAttributes.find(
                (ota) => ota.id == a.objectTypeAttributeId
              );
              let fieldValue = null;

              if (attributeDetail && attributeDetail.referenceType) {
                let v = [];

                a.objectAttributeValues.forEach((val) => {
                  v.push({
                    name: val.displayValue,
                    crn:
                      "crn:ops:" +
                      val.referencedObject.objectType.name
                        .toLowerCase()
                        .replace(/[^A-Z0-9]+/gi, "_"),
                    resourceid: val.referencedObject.id,
                  });
                });

                fieldValue = JSON.stringify(v);
              } else {
                fieldValue = a.objectAttributeValues
                  .map((v) => {
                    return v.displayValue;
                  })
                  .join(",");
              }

              assetDetails.push({
                crn: crn,
                fieldkey:
                  `${crn}/fk:` +
                  attributeDetail.name
                    .toLowerCase()
                    .replace(/[^A-Z0-9]+/gi, "_"),
                fieldvalue: fieldValue,
                resourceid: resourceId,
                status: "Active",
                createdby: "SYSTEM",
                createddt: o.created,
                lastupdatedby: "SYSTEM",
                lastupdateddt: new Date(),
                tenantid: this.objType.schema.sync.tenantid,
                meta: JSON.stringify(a),
              });
            });
          }
        });

        console.log(
          `>>>> Pulling "Objects" ${this.currentPage * this.objectsPerPage}/${
            this.totalObjects
          } `
        );

        db.AssetsDtl.bulkCreate(assetDetails)
          .then(async () => {
            try {
              await Promise.all(
                data.objectEntries.map((o) => {
                  return this.processObjectAttachmentsLists(o);
                })
              );
              await Promise.all(
                data.objectEntries.map((o) => {
                  return this.processObjectComments(o);
                })
              );
              await Promise.all(
                data.objectEntries.map((o) => {
                  return this.processObjectHistory(o);
                })
              );
              this.currentPage += 1;
              this.processObjects();
              // this.e.emit("done");
            } catch (error) {
              console.error(
                `>>>> Error processing attachments or comments for "ObjectType" (${
                  this.objectTypeData.name
                }) in batch ${this.currentPage * this.objectsPerPage}/${
                  this.totalObjects
                } `
              );
              console.log(error);
            }
          })
          .catch((err) => {
            console.error(
              `>>>> Error creating details for "ObjectType" (${
                this.objectTypeData.name
              }) in batch ${this.currentPage * this.objectsPerPage}/${
                this.totalObjects
              } `
            );
            console.error(err.toString().substring(1, 1000));
          });
      } else {
        console.log(
          `>>>> Added all "Objects" for "ObjectType" ${this.objectTypeData.name}`
        );
        this.e.emit("done");
      }
    } catch (error) {
      console.error("ERROR GETTING OBJECTS");
      console.error(error);
      this.objType.schema.sync.store.push(
        "ERR",
        JSON.stringify({
          err: error.toString(),
          message: `>>>>> "Object" Error in processing Objects list.`,
        })
      );
      this.currentPage += 1;
      this.processObjects();
    }
  }

  processObjectAttachmentsLists(object: ObjectEntry) {
    return new Promise(async (resolve, reject) => {
      const crn =
        "crn:ops:" +
        object.objectType.name.toLowerCase().replace(/[^A-Z0-9]+/gi, "_");
      try {
        const { data } = await axios.get<IAttachment[]>(
          this.objType.schema.sync.host +
            epObjectsGetAttachmentsList +
            object.id,
          {
            timeout: 1000 * 30,
            headers: {
              Authorization: "Basic " + this.objType.schema.sync.basicAuth,
            },
          }
        );
        console.log(
          `>>>>> Attachments to process for "Object" ${object.id} is ${data.length}`
        );

        if (data && data.length > 0) {
          await Promise.all(
            data.map((a) => {
              return this.processAttachment(a, crn + "/" + object.id, crn);
            })
          );
          resolve("Attachments processed.");
        } else {
          resolve("Attachments processed.");
        }
      } catch (error) {
        this.objType.schema.sync.store.push(
          "ERR",
          JSON.stringify({
            err: error.toString(),
            message: `>>>>> "Object" (${
              crn + "/" + object.id
            }) Error in processing attachments list.`,
          })
        );
        resolve(true);
      }
    });
  }

  processAttachment(attachment: IAttachment, resourceid: string, crn: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const s3 = new S3({
          endpoint: process.env.S3ENDPT,
          accessKeyId: process.env.S3ENDPT,
          secretAccessKey: process.env.S3SECRETACCESSKEY,
        });

        const { data } = await axios.get(attachment.url, {
          headers: {
            Authorization: "Basic " + this.objType.schema.sync.basicAuth,
          },
          responseType: "stream",
          timeout: 1000 * 30,
        });
        console.log(
          `>>>>> Attachment to process ${attachment.filename} of size ${attachment.filesize}`
        );
        s3.upload(
          {
            Bucket: process.env.S3_BUCKET_STATICS,
            Key: "JIRA-SYNC/" + attachment.filename,
            Body: data,
            ACL: "private",
            ContentType: attachment.mimeType,
          },
          async (err, _) => {
            if (!err) {
              // console.log(data);
              await db.AssetsDocument.create({
                mimetype: attachment.mimeType,
                filename: attachment.filename,
                filesize: attachment.filesize,
                comment: attachment.comment,
                url: attachment.url,
                status: "Active",
                createdby: attachment.author,
                createddt: attachment.created,
                updatedby: attachment.author,
                updateddt: new Date(),
                tenantid: this.objType.schema.sync.tenantid,
                meta: JSON.stringify({
                  attachment,
                  storage: _,
                }),
                resourceid,
                crn,
              });
              console.log(
                `>>>>> Attachment processed : ${attachment.filename} of size ${attachment.filesize}`
              );
              resolve(true);
            } else {
              reject(err);
            }
          }
        );
      } catch (error) {
        this.objType.schema.sync.store.push(
          "ERR",
          JSON.stringify({
            err: error.toString(),
            message: `>>>>> "Object" (${
              crn + "/" + resourceid
            }) Error in processing attachment.`,
          })
        );
        resolve(true);
      }
    });
  }

  processObjectComments(object: ObjectEntry) {
    return new Promise(async (resolve, reject) => {
      const crn =
        "crn:ops:" +
        object.objectType.name.toLowerCase().replace(/[^A-Z0-9]+/gi, "_");
      try {
        const { data } = await axios.get<IObjectComment[]>(
          this.objType.schema.sync.host + epObjectsGetCommentsList + object.id,
          {
            headers: {
              Authorization: "Basic " + this.objType.schema.sync.basicAuth,
            },
            timeout: 1000 * 30,
          }
        );
        console.log(
          `>>>>> Comments to process for "Object" ${object.id} is ${data.length}`
        );

        if (data && data.length > 0) {
          db.AssetsComment.bulkCreate(
            data.map((comment) => {
              return {
                crn,
                resourceid: crn + "/" + comment.objectId,
                comment: comment.comment,
                meta: JSON.stringify(comment),
                tenantid: this.objType.schema.sync.tenantid,
                status: "Active",
                createdby: comment.actor.displayName,
                createddt: comment.created,
                lastupdatedby: comment.actor.displayName,
                lastupdateddt: comment.updated,
              };
            })
          )
            .then(() => {
              resolve(true);
            })
            .catch((err) => {
              console.log(
                `>>>>> Error processing comments for "Object" ${object.id}`
              );
              reject(err);
            });
        } else {
          resolve("Comments processed.");
        }
      } catch (error) {
        this.objType.schema.sync.store.push(
          "ERR",
          JSON.stringify({
            err: error.toString(),
            message: `>>>>> "Object" (${
              crn + "/" + object.id
            }) Error in processing comments.`,
          })
        );
        resolve(true);
      }
    });
  }

  processObjectHistory(object: ObjectEntry) {
    return new Promise(async (resolve, reject) => {
      const crn =
        "crn:ops:" +
        object.objectType.name.toLowerCase().replace(/[^A-Z0-9]+/gi, "_");
      try {
        const { data } = await axios.get<IObjectHistory[]>(
          this.objType.schema.sync.host +
            epObjectsGetHistoryList.replace(
              "{{objectid}}",
              object.id.toString()
            ),
          {
            headers: {
              Authorization: "Basic " + this.objType.schema.sync.basicAuth,
            },
            timeout: 1000 * 30,
          }
        );
        console.log(
          `>>>>> History to process for "Object" ${object.id} is ${data.length}`
        );

        if (data && data.length > 0) {
          db.AssetsHistory.bulkCreate(
            data.map((history) => {
              return {
                crn,
                resourceid: crn + "/" + history.objectId,
                old: history.oldValue,
                new: history.newValue,
                type: history.type,
                affectedattribute: history.affectedAttribute,
                meta: JSON.stringify(history),
                tenantid: this.objType.schema.sync.tenantid,
                status: "Active",
                createdby: history.actor.displayName,
                createddt: history.created,
                updatedby: history.actor.displayName,
                updateddt: new Date(),
              };
            })
          )
            .then(() => {
              resolve(true);
            })
            .catch((err) => {
              console.log(
                `>>>>> Error processing history for "Object" ${object.id}`
              );
              reject(err);
            });
        } else {
          resolve("History processed.");
        }
      } catch (error) {
        this.objType.schema.sync.store.push(
          "ERR",
          JSON.stringify({
            err: error.toString(),
            message: `>>>>> "Object" (${
              crn + "/" + object.id
            }) Error in processing history.`,
          })
        );
        resolve(true);
      }
    });
  }

  on(type: "done", handler: (...args: any[]) => void) {
    this.e.addListener(type, handler);
  }
}
