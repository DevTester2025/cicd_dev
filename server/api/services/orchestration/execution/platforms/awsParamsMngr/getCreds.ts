

import db from "../../../../../../api/models/model";
import { constants } from "../../../../../../common/constants";
import AWS = require("aws-sdk");
import AWSService from "../../../../providers/aws.service";


export default function getAWSCredentials(aws_config) {
    return new Promise(async (resolve, reject) => {
        console.log('Configs are --------------------------------------------');
        console.log(aws_config);
        const tenantregion = await db.TenantRegion.findOne({
            where: {
                region: aws_config.region,
                tenantid: aws_config.tenantid,
                _accountid: aws_config.account_id
            },
            include: [
                {
                    as: "accountdata",
                    model: db.CustomerAccount,
                    attributes: ["rolename"],
                    where: { status: constants.STATUS_ACTIVE },
                },
            ],
        });
        if (tenantregion) {
            AWSService.getCredentials(
                tenantregion["dataValues"],
                aws_config.tenantid
            )
                .then((awsCredentials: any) => {
                    let params: any = {
                        Name: aws_config.instancename
                    };
                    var ssm = new AWS.SSM({ region: aws_config.region, credentials: awsCredentials });
                    ssm.getParameter(params, function (err, data: any) {
                        if (err) {
                            reject(err);
                        } else {
                            console.log(data);
                            resolve(data.Parameter.Value);
                        }
                    });
                });
        }
    });
}