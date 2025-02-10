import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import { modules } from "../../../../common/module";
import { constants } from "../../../../common/constants";
import db from "../../../models/model";
import CommonService from "../../../services/common.service";


//Dashboard list counts
export class Controller {
  async all(req: Request, res: Response): Promise<void> {
    const response = {
      reference: modules.CICD_DASHBOARD
    };

    try {
      customValidation.isMandatoryLong(req.body.tenantid, 'tenantid', 1, 11);
      // deployment frequency calculation
      const deploymentFrequency = await new Controller().getDeploymentFrequency(req.body.tenantid, req, res, response);
      // success rate calculation
const totalcount = await db.ReleaseProcessHeader.count({ where: { tenantid: req.body.tenantid } });
const successrate = await db.ReleaseProcessHeader.count({ where: { tenantid: req.body.tenantid, status: constants.RELEASE_STATUS_COMPLETED } });
let successrateCalculation = '0.00'; 
if (totalcount > 0) {
  successrateCalculation = ((successrate / totalcount) * 100).toFixed(2);
}

      // complate and failed build count
      const promises = [
        db.ReleaseProcessHeader.count({ where: { tenantid: req.body.tenantid, status: constants.RELEASE_STATUS_COMPLETED } }),
        db.ReleaseProcessHeader.count({ where: { tenantid: req.body.tenantid, status: constants.RELEASE_STATUS_FAILED } }),
      ];

      const [successcount, faildcount, inprogresscount] = await Promise.all(promises);

      let groupdata = {
        SUCCESS: successcount,
        FAILED: faildcount,
        INPROGRESS: inprogresscount,
        DEPLOYMENTFREQUENCY: deploymentFrequency,
        SUCCESSRATE: successrateCalculation
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
  async getDeploymentFrequency(tenantid: any, req: Request<any>, res: Response<any>, response: any) {
    try {
      const currentDate = new Date();
      const thirtyDaysAgo = new Date();
       thirtyDaysAgo.setDate(currentDate.getDate() - 30);
       thirtyDaysAgo.setHours(0, 0, 0); 
        currentDate.setHours(23, 59, 59);
        const deploymentCount = await db.ReleaseProcessDetail.count({
        where: {
          tenantid: tenantid,
          referencetype: constants.REFERENCE_TYPE[3],
          lastupdateddt: {
            [db.Sequelize.Op.between]: [
              thirtyDaysAgo,
              currentDate
            ]
          }
        }
      });
        const deploymentFrequency = (deploymentCount / 30).toFixed(2); 
      return deploymentFrequency;
    } catch (error) {
      customValidation.generateAppError(error, response, res, req);
    }
  }
  

}

export default new Controller();


