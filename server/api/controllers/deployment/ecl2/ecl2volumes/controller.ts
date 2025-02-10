import commonService from "../../../../services/common.service";
import db from "../../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../../common/validation/customValidation";
import { constants } from "../../../../../common/constants";

export class Controller {
  constructor() {
    //
  }
  all(req: Request, res: Response): void {
    const response = {};
    try {
      let parameters = {} as any;
      parameters.where = req.body;
      parameters.include = [
        {
          model: db.ecl2zones,
          as: "ecl2zones",
          paranoid: false,
          required: false,
        },
        {
          model: db.Customer,
          as: "customer",
          paranoid: false,
          required: false,
          attributes: ["customerid", "ecl2tenantid"],
        },
      ];
      commonService
        .getAllList(parameters, db.ecl2volumes)
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

  byId(req: Request, res: Response): void {
    let response = {};
    try {
      let parameters = {} as any;
      parameters.where = { volumeid: req.params.id };
      if (req.query.asstdtls) {
        parameters.include = [] as any;
        parameters.include = [
          {
            model: db.ecl2zones,
            as: "ecl2zones",
            attributes: ["zonename", "region"],
          },
          {
            model: db.Instances,
            as: "instance",
            attributes: ["instancename", "instancetyperefid"],
          },
          {
            model: db.CostVisual,
            as: "costvisual",
            required: false,
            where: {
              status: constants.STATUS_ACTIVE,
            },
          },
        ];
      }
      commonService
        .getData(parameters, db.ecl2volumes)
        .then((data) => {
          customValidation.generateSuccessResponse(
            data,
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
    let response = {};
    try {
      // let requesturl = constants.ECL2_CREATE_VOLUME_URL;
      // let requestheader = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
      // let requestparams = {
      //     'volume': {
      //         'display_name': req.body.volumename,
      //         'display_description': req.body.description,
      //         'size': req.body.size
      //     }
      // };

      // commonService.callECL2Reqest('POST', req.body.region, req.body.tenantid, requesturl, requestheader, requestparams).then((ecl2data) => {
      //     req.body.ecl2volumeid = ecl2data.volume.id;
      commonService
        .create(req.body, db.ecl2volumes)
        .then((data) => {
          data.dataValues["ecl2volumeid"] =
            data.dataValues["volumeid"].toString();
          customValidation.generateSuccessResponse(
            data,
            response,
            constants.RESPONSE_TYPE_SAVE,
            res,
            req
          );
          commonService.update(
            { volumeid: data.dataValues["volumeid"] },
            { ecl2volumeid: data.dataValues["ecl2volumeid"] },
            db.ecl2volumes
          );
        })
        .catch((error: any) => {
          customValidation.generateAppError(error, response, res, req);
        });
      // }).catch((error: any) => {
      //     customValidation.generateAppError(error, response, res, req);
      // });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  update(req: Request, res: Response): void {
    let response = {};
    try {
      // let requesturl = constants.ECL2_DELETE_VOLUME_URL.replace('{volume_id}', req.body.ecl2volumeid);
      // let requestheader = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
      // let requestparams = {} as any;

      // commonService.callECL2Reqest('DELETE', req.body.region, req.body.tenantid, requesturl, requestheader, requestparams).then((ecl2data: any) => {
      //     let createparams = {
      //         'volume': {
      //             'display_name': req.body.volumename,
      //             'display_description': req.body.description,
      //             'size': req.body.size
      //         }
      //     };
      //     let createrequesturl = constants.ECL2_CREATE_VOLUME_URL;
      //     commonService.callECL2Reqest('POST', req.body.region, req.body.tenantid, createrequesturl, requestheader, createparams).then((data: any) => {
      //         req.body.ecl2volumeid = data.volume.id;
      let condition = { volumeid: req.body.volumeid };
      commonService
        .update(condition, req.body, db.ecl2volumes)
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
      //     }).catch((error: any) => {
      //         customValidation.generateAppError(error, response, res, req);
      //     });
      // }).catch((error: any) => {
      //     customValidation.generateAppError(error, response, res, req);
      // });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
}
export default new Controller();
