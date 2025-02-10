import { Request, Response } from "express";
import { modules } from "../../../../../common/module";
import { constants } from "../../../../../common/constants";
import db from "../../../../models/model";
import { customValidation } from "../../../../../common/validation/customValidation";
import CommonService from "../../../../services/common.service";
import { Op } from "sequelize";

export class Controller {
    async all(req: Request, res: Response): Promise<void> {
        const response = {
            reference: modules.CICD_DASHBOARD
        };
        try {
            customValidation.isMandatoryLong(req.query.tenantid, 'tenantid', 1, 11);
            customValidation.isMandatoryLong(req.query.days, 'days', 1, 10);
            let parameters = {
                where: { tenantid: req.query.tenantid },
            };
            parameters.where["days"] = req.query.days;
            let num: number = Number(req.query.days);
            const endDate = new Date(); // Current date
            const sttDate = new Date();
            const stdt =  sttDate.setDate(sttDate.getDate() - num); // Subtract n days from current da
            const startDate = new Date(stdt);

            const promises = [
                await db.ReleaseProcessHeader.count({
                    where: {
                        tenantid: req.query.tenantid,
                    },
                }),
                await db.ReleaseProcessHeader.count({
                    where: {
                        tenantid: req.query.tenantid,
                        lastupdateddt: {
                            [Op.between]: [startDate, endDate], // Find records between startDate and endDate
                        },
                        status: constants.RELEASE_STATUS_COMPLETED
                    },
                }),
                await db.ReleaseProcessHeader.count({
                    where: {
                        tenantid: req.query.tenantid,
                        lastupdateddt: {
                            [Op.between]: [startDate, endDate], // Find records between startDate and endDate
                        },
                        status: constants.RELEASE_STATUS_FAILED
                    },
                }),
                await db.ReleaseProcessHeader.count({
                    where: {
                        tenantid: req.query.tenantid,
                        lastupdateddt: {
                            [Op.between]: [startDate, endDate], // Find records between startDate and endDate
                        },
                        status: constants.RELEASE_STATUS_INPROGRESS
                    },
                }),
                await db.ReleaseProcessHeader.count({
                    where: {
                        tenantid: req.query.tenantid,
                        lastupdateddt: {
                            [Op.between]: [startDate, endDate], // Find records between startDate and endDate
                        },
                        status: constants.RELEASE_STATUS_PENDING
                    },
                }),
                 await db.ReleaseProcessHeader.count({
                    where: {
                        tenantid: req.query.tenantid,
                        lastupdateddt: {
                             [Op.between]: [startDate, endDate], 
                        },
                        status: constants.RELEASE_STATUS_CANCELLED
                    },
               }),
            ];


            const [totalrecord, successcount, faildcount, inprogresscount, pendingcount,cancelledcount] = await Promise.all(promises);

            let groupdata = {
                TOTAL: totalrecord,
                SUCCESS: successcount,
                FAILED: faildcount,
                INPROGRESS: inprogresscount,
                PENDING: pendingcount,
                CANCELLED: cancelledcount
            }


            const list = await CommonService.getAllMasterList(groupdata);

            customValidation.generateSuccessResponse(
                list,
                response,
                constants.RESPONSE_TYPE_LIST,
                res,
                req
            );

        } catch (e) {
            customValidation.generateAppError(e, response, res, req);
        }
    }

}
export default new Controller();