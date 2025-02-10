import { Request, Response } from "express";
import { Op } from "sequelize";
import { modules } from "../../../../../common/module";
import db from "../../../../models/model";
import { customValidation } from "../../../../../common/validation/customValidation";
import { constants } from "../../../../../common/constants";

export class Controller {
    async all(req: Request, res: Response): Promise<void> {
        const response = {
            reference: modules.CICD_DASHBOARD,
            data: []
        };

     
        if (req.query.months == null && req.query.months == undefined && req.query.days != null && req.query.days >= constants.FILTER_DAYS[0] || req.query.days <= constants.FILTER_DAYS[1]) {

            try {
                customValidation.isMandatoryLong(req.query.tenantid, 'tenantid', 1, 11);
                customValidation.isOptionalLong(req.query.days, 'days', 1, 11);
                customValidation.isOptionalLong(req.query.months, 'months', 1, 11);
                const startDate = new Date();
                const endDate = new Date();
                let num: number = Number(req.query.days);
                startDate.setDate(startDate.getDate() - num);

                let successData: { getDataValue: (arg: string) => any }[] = await db.ReleaseProcessHeader.findAll({
                    where: {
                        tenantid: req.query.tenantid,
                        status: req.query.successstatus,
                        lastupdateddt: {
                            [Op.between]: [startDate, endDate]
                        }
                    },
                    attributes: [
                        [db.sequelize.fn('date_format', db.sequelize.col('lastupdateddt'), '%b-%e'), 'Date'],
                        [db.sequelize.fn('count', db.sequelize.col('status')), constants.DASHBOARD_SUCCESS_STATUS]
                    ],
                    group: [db.sequelize.fn('date_format', db.sequelize.col('lastupdateddt'), '%b-%e')]
                });

                let failedData: { getDataValue: (arg: string) => any }[] = await db.ReleaseProcessHeader.findAll({
                    where: {
                        tenantid: req.query.tenantid,
                        status: req.query.failedstatus,
                        lastupdateddt: {
                            [Op.between]: [startDate, endDate]
                        }
                    },
                    attributes: [
                        [db.sequelize.fn('date_format', db.sequelize.col('lastupdateddt'), '%b-%e'), 'Date'],
                        [db.sequelize.fn('count', db.sequelize.col('status')), constants.DASHBOARD_FAILED_STATUS]
                    ],
                    group: [db.sequelize.fn('date_format', db.sequelize.col('lastupdateddt'), '%b-%e')]
                });

                console.log("failedData", JSON.parse(JSON.stringify(failedData)));
                const successMap: { [key: string]: number } = {};
                successData.forEach(item => {
                    const date = item.getDataValue('Date');
                    const success = item.getDataValue(constants.DASHBOARD_SUCCESS_STATUS);
                    if (date && success !== undefined) { // Check for null and undefined values
                        successMap[date] = success;
                    }
                });
                const failedMap: { [key: string]: number } = {};
                failedData.forEach(item => {
                    const date = item.getDataValue('Date');
                    const failed = item.getDataValue(constants.DASHBOARD_FAILED_STATUS);
                    if (date && failed !== undefined) { // Check for null and undefined values
                        failedMap[date] = failed;
                    }
                });

                const dateRange = getDateRange(startDate, endDate);
                dateRange.forEach(date => {
                    const successCount = successMap[date] || 0;
                    const failedCount = failedMap[date] || 0;
                    response.data.push({ Date: date, success: successCount, failed: failedCount });
                });

                 new Controller().successStatus(req,res, response);
            } catch (e) {
              
                customValidation.generateAppError(e, response, res, req);
            }
        }
      await new Controller().getMonthlyData(req,res, response);
      
    }
    async getMonthlyData(req: Request<any>, res: Response<any>, response: { reference: "Dashboard"; data: any[]; }) {
        if (req.query.days == null && req.query.months !=null && req.query.months == constants.FILTER_DAYS[2] || req.query.months == constants.FILTER_DAYS[3]) {
            try {
                const startDate = new Date();
                let numMonths: number = Number(req.query.months); 

                startDate.setMonth(startDate.getMonth() - numMonths + 1);
                const successData: { getDataValue: (arg: string) => any }[] = await db.ReleaseProcessHeader.findAll({
                    where: {
                        tenantid: req.query.tenantid,
                        status: req.query.successstatus,
                        lastupdateddt: {
                            [Op.gte]: startDate, 
                            [Op.lte]: new Date() 
                        }
                    },
                    attributes: [
                        [db.sequelize.fn('date_format', db.sequelize.col('lastupdateddt'), '%b %Y'), 'Date'],
                        [db.sequelize.fn('count', db.sequelize.col('status')), 'success']
                    ],
                    group: [db.sequelize.fn('date_format', db.sequelize.col('lastupdateddt'), '%b %Y')]
                });

                const failedData: { getDataValue: (arg: string) => any }[] = await db.ReleaseProcessHeader.findAll({
                    where: {
                        tenantid: req.query.tenantid,
                        status: req.query.failedstatus,
                        lastupdateddt: {
                            [Op.gte]: startDate, 
                            [Op.lte]: new Date() 
                        }
                    },
                    attributes: [
                        [db.sequelize.fn('date_format', db.sequelize.col('lastupdateddt'), '%b %Y'), 'Date'],
                        [db.sequelize.fn('count', db.sequelize.col('status')), 'failed']
                    ],
                    group: [db.sequelize.fn('date_format', db.sequelize.col('lastupdateddt'), '%b %Y')]
                });

                const successMap: { [key: string]: number } = {};
                successData.forEach(item => {
                    const date = item.getDataValue('Date');
                    const success = item.getDataValue('success');
                    if (date && success !== undefined) {
                        successMap[date] = success;
                    }
                });

                const failedMap: { [key: string]: number } = {};
                failedData.forEach(item => {
                    const date = item.getDataValue('Date');
                    const failed = item.getDataValue('failed');
                    if (date && failed !== undefined) {
                        failedMap[date] = failed;
                    }
                });

                const dateRange = getMonthRange(startDate, numMonths);

                dateRange.forEach(date => {
                    const successCount = successMap[date] || 0;
                    const failedCount = failedMap[date] || 0;
                    response.data.push({ Date: date, success: successCount, failed: failedCount });
                })
                 new Controller().successStatus(req,res, response);

            } catch (e) {
                customValidation.generateAppError(e, response, res, req);            }
        }
    }
    
    successStatus(req: Request<any>, res: Response<any>, response: { reference: "Dashboard"; data: any[]; }) {
        res.json({
            status: true,
            code: 200,
            message: 'List found',
            data: response.data
          });
    }
}

function getDateRange(startDate: Date, endDate: Date): string[] {
    const dateRange: string[] = [];
    let currentDate = new Date(startDate);
    let options: any = { month: 'short', day: 'numeric' }; // Date formatting options

    while (currentDate <= endDate) {
        // Modify date formatting to include a hyphen between month and day
        dateRange.push(currentDate.toLocaleDateString('en-US', options).replace(' ', '-'));
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dateRange;
}

export default new Controller();

function getMonthRange(startDate: Date, numMonths: number) {
    const dateRange: string[] = [];
    let currentDate = new Date(startDate);
    let options: any = { month: 'short', year: 'numeric' }; // Date formatting options

    for (let i = 0; i < numMonths; i++) {
        dateRange.push(currentDate.toLocaleDateString('en-US', options));
        currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return dateRange;
}
