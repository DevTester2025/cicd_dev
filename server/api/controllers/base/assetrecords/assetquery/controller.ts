import { Request, Response } from "express";
import * as _ from "lodash";
import sequelize = require("sequelize");
import { constants } from "../../../../../common/constants";
import { modules } from "../../../../../common/module";
import { customValidation } from "../../../../../common/validation/customValidation";
import { CommonHelper } from "../../../../../reports";
import { AssetListTemplate } from "../../../../../reports/templates";
import db from "../../../../models/model";
import commonService from "../../../../services/common.service";
import { DownloadService } from "../../../../services/download.service";

export class Controller {
    constructor() { }
    all(req: Request, res: Response): void {
        const response = { reference: modules.CMDBREPORT };
        try {
            let parameters = { where: req.body };
            parameters["order"] = [["createddt", "desc"]];
            commonService
                .getAllList(parameters, db.AssetsQuery)
                .then((list) => {
                    customValidation.generateSuccessResponse(
                        list,
                        response,
                        constants.RESPONSE_TYPE_LIST,
                        res,
                        req
                    );
                })
                .catch((error: Error) => {
                    customValidation.generateAppError(error, response, res, req);
                });
        } catch (e) {
            customValidation.generateAppError(e, response, res, req);
        }
    }
    create(req: Request, res: Response): void {
        let response = { reference: modules.CMDBREPORT };
        try {
            commonService
                .create(req.body, db.AssetsQuery)
                .then((data) => {
                    customValidation.generateSuccessResponse(
                        data,
                        response,
                        constants.RESPONSE_TYPE_SAVE,
                        res,
                        req
                    );
                })
                .catch((error: Error) => {
                    customValidation.generateAppError(error, response, res, req);
                });
        } catch (e) {
            console.log(e)
            customValidation.generateAppError(e, response, res, req);
        }
    }

    update(req: Request, res: Response): void {
        let response = { reference: modules.CMDBREPORT };
        try {
            let condition = { id: req.body.id };
            commonService
                .update(condition, req.body, db.AssetsQuery)
                .then((data) => {
                    customValidation.generateSuccessResponse(
                        data,
                        response,
                        constants.RESPONSE_TYPE_UPDATE,
                        res,
                        req
                    );
                })
                .catch((error: Error) => {
                    customValidation.generateAppError(error, response, res, req);
                });
        } catch (e) {
            customValidation.generateAppError(e, response, res, req);
        }
    }

    byId(req: Request, res: Response): void {
        let response = { reference: modules.CMDBREPORT };
        try {
            commonService.getById(req.params.id, db.AssetsQuery)
                .then((data) => {
                    if (data.query != '') {
                        let q = JSON.parse(data.query);
                        q = q + ` LIMIT 10,0`;
                        commonService.executeQuery(q, {}, db.sequelize).then((report) => {
                            customValidation.generateSuccessResponse(
                                report,
                                response,
                                constants.RESPONSE_TYPE_LIST,
                                res,
                                req
                            );
                        })
                    }
                })
                .catch((error: Error) => {
                    customValidation.generateAppError(error, response, res, req);
                });
        } catch (e) {
            customValidation.generateAppError(e, response, res, req);
        }
    }

    async queryreport(req: Request, res: Response) {
        try {
            let q = `select {xaxis},{yaxis} from ({mainq})a WHERE {condition}`;
            let query = `select * from ({joinquery}) WHERE 1=1`;
            let joinquery = '';
            let mainsubquery = `(select {fieldquery}d.resource from asset_record_view1 d where crn IN ({crn}) and field_key IN ({fieldkeys}) and referenceid IS NULL GROUP BY d.resource ORDER BY d.resource ASC)tmp1`;
            let fieldquery = '';
            let wherecondition = '';
            let condition = '';
            let xaxis = '';
            let yaxis = '';


            let groupedresources: any = _.groupBy(req.body.fields, 'resourcetype');
            let i = 1;
            _.map(groupedresources, function (value, key) {
                i = i + 1;
                fieldquery = '';
                value.map((e, i) => {

                    if (e.filters && !_.isEmpty(e.filters)) {
                        if (e.filters.operation == 'BETWEEN') {
                            wherecondition = wherecondition + ` AND ${e.header.replace(/ /g, "$")}_condition ${e.filters.operation} '${e.filters.value[0]}' AND '${e.filters.value[1]}'`;
                        } else if (e.fieldtype == "DateTime" &&
                            (e.filters.operation == "<" || e.filters.operation == ">" || e.filters.operation == "=")) {
                            wherecondition = wherecondition + ` AND ${e.header.replace(/ /g, "$")}_condition ${e.filters.operation} '${e.filters.value[0]}'`;
                        } else if (e.fieldtype != "DateTime" &&
                            (e.filters.operation == "<" || e.filters.operation == ">" || e.filters.operation == "=")) {
                            wherecondition = wherecondition + ` AND (${e.header.replace(/ /g, "$")}_condition ${e.filters.operation} '${e.filters.value.fieldvalue}')`;
                        } else {
                            let v = e.filters.value.map((e) => `'${e.fieldvalue}'`);
                            wherecondition = wherecondition + ` AND (${e.header.replace(/ /g, "$")}_condition ${e.filters.operation} (${v.join(',')}))`;
                        }
                    }
                    fieldquery = fieldquery + `max(case when d.field_key='${e.fieldkey}' then d.field_value end) as '${e.header.replace(/ /g, "$")}_condition',`;
                });
                let idx = i;
                if (req.body.type == key) {
                    mainsubquery = mainsubquery.replace('{mainresourcetype}', `'${req.body.type}'`);
                    mainsubquery = mainsubquery.replace('{fieldkeys}', value.map((e) => { return `'${e.fieldkey}'` }));
                    mainsubquery = mainsubquery.replace('{crn}', `'${value[0].crn}'`);
                    mainsubquery = mainsubquery.replace('{fieldquery}', fieldquery);
                    joinquery = joinquery + mainsubquery;
                } else {
                    let subquery = `(select {fieldquery}d.resource as {resourcename} from asset_record_view1 d where crn IN ({crn}) and field_key IN ({fieldkeys}) GROUP BY d.resource,d.referenceid){alias}`;
                    subquery = subquery.replace('{fieldkeys}', value.map((e) => { return `'${e.fieldkey}'` }));
                    subquery = subquery.replace('{crn}', `'${value[0].crn}'`);
                    subquery = subquery.replace('{fieldquery}', fieldquery);
                    subquery = subquery.replace('{resourcename}', `resource${idx}`);
                    subquery = subquery.replace('{alias}', `tmp${idx}`);
                    joinquery = joinquery + ` LEFT JOIN ` + subquery + ` ON tmp1.resource = tmp${idx}.resource${idx}`;
                }
            });

            query = query.replace('{joinquery}', joinquery);
            if (wherecondition != '') {
                query = query + ` {whereq}`;
                query = query.replace('{whereq}', wherecondition);
            }
            query = query + ` ORDER BY resource ASC `;
            q = q.replace('{mainq}', query);
            if (req.body.settings) {
                if (req.body.settings.xaxis) {
                    xaxis = `a.${req.body.settings.xaxis.fieldname.replace(/ /g, "$")}_condition as 'x'`;
                    condition = condition + `a.${req.body.settings.xaxis.fieldname.replace(/ /g, "$")}_condition is not null`;
                    q = q.replace('{condition}', condition);
                }
            }
            let yaxislist = '';
            if (req.body.settings.yaxisList) {
                req.body.settings.yaxisList.map((e, i) => {
                    if ((i + 1) != req.body.settings.yaxisList.length) {
                        yaxis = yaxis + `${e.aggregate}(DISTINCT(a.${e.yaxis.fieldname.replace(/ /g, "$")}_condition)) as 'y${i}', GROUP_CONCAT(DISTINCT(a.${e.yaxis.fieldname.replace(/ /g, "$")}_condition)) as 'y${i}value',`;
                        yaxislist = yaxislist + `y${i},`;
                    } else {
                        yaxis = yaxis + `${e.aggregate}(DISTINCT(a.${e.yaxis.fieldname.replace(/ /g, "$")}_condition)) as 'y${i}', GROUP_CONCAT(DISTINCT(a.${e.yaxis.fieldname.replace(/ /g, "$")}_condition)) as 'y${i}value'`;
                        yaxislist = yaxislist + `y${i}`;
                    }

                })
            }
            q = q.replace("{xaxis}", xaxis);
            q = q.replace("{yaxis}", yaxis);
            q = q + ` GROUP BY x`;
            if (req.body.settings && req.body.settings.order) {
                q = q + ` ORDER BY x ${req.body.settings.order}`;
            }
            if (req.body.settings.limit) {
                q = q + ` LIMIT ${req.body.settings.limit}`;
            }
            let data = await db.sequelize.query(q, {
                type: sequelize.QueryTypes.SELECT,
            });
            data = _.map(data, function (e) {
                const obj = {};
                Object.keys(e).map((k) => {
                    obj[k.replace(/\$/g, " ").replace(/\_condition/g, "")] = e[k];
                    if (k == "resource") {
                        obj[k] = e[k];
                    }
                });
                e = obj;
                return e;
            });
            if (req.query.count) {
                let q = `select count(*) as 'count' from (` + query + `)r`;
                let c = await db.sequelize.query(q, {
                    type: sequelize.QueryTypes.SELECT,
                });
                res.send({
                    count: c && c.length > 0 ? c[0]["count"] : 0
                });
            } else {
                if (req.query.isdownload) {
                    let template = {
                        content: AssetListTemplate,
                        engine: "handlebars",
                        helpers: CommonHelper,
                        recipe: "html-to-xlsx",
                    };
                    let d = { lists: data, headers: req.body.headers };
                    //   DownloadService.generateFile(d, template, (result) => {
                    //     res.send({
                    //       data: result,
                    //     });
                    //   });
                } else {

                    res.send({
                        count: 0,
                        rows: data,
                    });
                }
            }


        } catch (e) {

        }
    }

    async report(req: Request, res: Response): Promise<void> {
        try {
            if (req.body) {
                let query = `select {xaxis},{yaxis} from ({subquery})a where 1=1`;
                let subquery = '';
                let wherequery = '';
                let wherequery1 = '';
                let fieldq = '';
                let xaxis = '';
                let yaxis = '';
                if (req.body.settings) {
                    if (req.body.settings.xaxis) {
                        xaxis = `a.${req.body.settings.xaxis.fieldname.replace(/ /g, "$")}_condition as 'x'`;
                    }
                }
                if (req.body.settings.yaxisList) {
                    req.body.settings.yaxisList.map((e, i) => {
                        if ((i + 1) != req.body.settings.yaxisList.length) {
                            yaxis = yaxis + `${e.aggregate}(a.${e.yaxis.fieldname.replace(/ /g, "$")}_condition) as 'y${i}',`
                        } else {
                            yaxis = yaxis + `${e.aggregate}(a.${e.yaxis.fieldname.replace(/ /g, "$")}_condition) as 'y${i}'`
                        }
                    })
                }
                query = query.replace("{xaxis}", xaxis);
                query = query.replace("{yaxis}", yaxis);

                if (req.body.type) {
                    wherequery = wherequery + ` d.type IN ('${req.body.type}')`;
                }
                if (req.body.resourcetype) {
                    let r = _.map(req.body.resourcetype, function (e) {
                        return `'${e}'`
                    });
                    wherequery = wherequery + ` AND d.resourcetype IN (${r.join(",")})`
                }
                if (req.body.fields) {
                    let f = _.map(req.body.fields, function (e) {
                        return `'${e.fieldkey}'`
                    });
                    wherequery = wherequery + ` AND d.field_key IN (${f.join(",")})`;
                    if (req.body.resourcetype.length > 1) {
                        wherequery = wherequery + `AND d.referenceid IS NOT NULL `;
                    }
                    req.body.fields.map((e, i) => {
                        if (e.filters && !_.isEmpty(e.filters) && e.resourcetype == req.body.type) {
                            if (e.filters.operation == 'BETWEEN') {
                                wherequery1 = wherequery1 + ` AND ${e.header.replace(/ /g, "$")}_condition ${e.filters.operation} '${e.filters.value[0]}' AND '${e.filters.value[1]}'`;
                            } else if (e.fieldtype == "DateTime" &&
                                (e.filters.operation == "<" || e.filters.operation == ">" || e.filters.operation == "=")) {
                                wherequery1 = wherequery1 + ` AND ${e.header.replace(/ /g, "$")}_condition ${e.filters.operation} '${e.filters.value[0]}'`;
                            } else if (e.fieldtype != "DateTime" &&
                                (e.filters.operation == "<" || e.filters.operation == ">" || e.filters.operation == "=")) {
                                wherequery1 = wherequery1 + ` AND (${e.header.replace(/ /g, "$")}_condition ${e.filters.operation} '${e.filters.value.fieldvalue}')`;
                            } else {
                                let v = e.filters.value.map((e) => `'${e.fieldvalue}'`);
                                let resourceid = e.filters.value.map((e) => `'${e.resourceids}'`);
                                wherequery1 = wherequery1 + ` AND (${e.header.replace(/ /g, "$")}_condition ${e.filters.operation} (${v.join(',')}))`;
                            }
                        } else {
                            if (e.resourcetype != req.body.type && e.filters && !_.isEmpty(e.filters)) {
                                let condition;
                                if (e.filters.operation == 'BETWEEN') {
                                    condition = ` field_value ${e.filters.operation} '${e.filters.value[0]}' AND '${e.filters.value[1]}'`;
                                } else if (e.fieldtype == "DateTime" &&
                                    (e.filters.operation == "<" || e.filters.operation == ">" || e.filters.operation == "=")) {
                                    condition = ` field_value ${e.filters.operation} '${e.filters.value[0]}'`;
                                } else if (e.fieldtype != "DateTime" &&
                                    (e.filters.operation == "<" || e.filters.operation == ">" || e.filters.operation == "=")) {
                                    condition = ` field_value ${e.filters.operation} '${e.filters.value.fieldvalue}'`;
                                } else {
                                    let v = e.filters.value.map((e) => `'${e.fieldvalue}'`);
                                    condition = ` field_value ${e.filters.operation} (${v.join(',')})`;
                                }
                                let subq = `AND d.resource IN (select resource from asset_dtl_view adv where {condition})`;
                                subq = subq.replace('{condition}', condition);
                                wherequery = wherequery + subq;
                            }
                        }
                        if (e.resourcetype == req.body.type) {
                            fieldq = fieldq + `max(case when d.field_key='${e.fieldkey}' then d.field_value end) as '${e.header.replace(/ /g, "$")}_condition',`
                        } else {
                            fieldq = fieldq + `max(case when d.field_key='${e.fieldkey}' then d.field_value end) as '${e.header.replace(/ /g, "$")}_condition',`
                        }
                    });
                    subquery = `select {fieldq}d.resource,d.resourcetype,d.type from asset_dtl_view d where {whereq} group by d.resource,d.referenceid `;
                    subquery = subquery.replace("{fieldq}", fieldq);

                }
                subquery = subquery.replace("{whereq}", wherequery);

                query = query.replace("{subquery}", subquery);
                console.log('q', query)
                let countq = `select count(*) as count from ({subquery})a where 1=1`;
                countq = countq.replace("{subquery}", subquery);
                if (wherequery1 != '') countq = countq + wherequery1;
                const count = await db.sequelize.query(countq, {
                    type: sequelize.QueryTypes.SELECT,
                });
                if (count) {
                    if (wherequery1 != '') query = query + wherequery1;
                    // if (req.body.savequery) {
                    //   req.body.savequery.query = JSON.stringify(query);
                    //   CommonService.create(req.body.savequery, db.AssetsQuery)
                    // }
                    query = query + ` GROUP BY x`
                    if (req.body.settings.limit) {
                        query = query + ` limit ${req.body.settings.limit}`;
                    }
                    let data = await db.sequelize.query(query, {
                        type: sequelize.QueryTypes.SELECT,
                    });
                    // data = _.map(data, function (e) {
                    //     const obj = {};
                    //     Object.keys(e).map((k) => {
                    //         obj[k.replace(/\$/g, " ").replace(/\_condition/g, "")] = e[k];
                    //         if (k == "resource") {
                    //             obj[k] = e[k];
                    //         }
                    //     });
                    //     e = obj;
                    //     return e;

                    // });
                    // data = _.map(data, function (e) {
                    //   if (e.resourcetype != e.type) {
                    //     let h = _.find(data, function (i) { return i.resource == e.resource && i.type == req.body.type });
                    //     req.body.fields.map((f) => {
                    //       if (f.resourcetype == req.body.type) {
                    //         e[f['header']] = h[f['header']];
                    //       }
                    //       if (f['header'] == e[f['header']] && f.fieldtype == "REFERENCE") {
                    //         let val = JSON.parse(e[f['header']]);
                    //         e[f['header']] = (val && val.length > 0) ? _.map(val, function (i) { return i.name }) : val;
                    //       }
                    //     })
                    //   }

                    //   return e;
                    // })
                    res.send({
                        count: count && count.length > 0 ? count[0]["count"] : 0,
                        rows: data,
                    });

                }

            }
        } catch (e) {

        }
    }
}

export default new Controller();
