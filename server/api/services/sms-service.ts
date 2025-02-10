var aws = require("aws-sdk");
import NotificationService from "./notification.service";
import { smsConfig } from "../../common/sms";

const sendSMS = function (
  to: string,
  message: string,
  user: any,
  event: any,
  solutionid: any,
  config: any,
  comments: any,
  otp?
) {
  try {
    console.log("sms service called" + smsConfig);
    // aws.config.update({
    //     region: smsConfig.region,
    //     accessKeyId: smsConfig.accessKeyId,
    //     secretAccessKey: smsConfig.secretAccessKey
    // });

    // var sns = new aws.SNS();
    // sns.setSMSAttributes({
    //     attributes: { DefaultSMSType: "Transactional" }
    // },
    //     function (error) {
    //         if (error) {
    //             console.log(error);
    //         }
    //     });
    // console.log(`Sending SMS. Phone: ${to}, body: ${message}`);
    // var params = {
    //     Message: message,
    //     MessageStructure: 'string',
    //     PhoneNumber: to
    // };

    // sns.publish(params, function (err, data) {
    //     if (err) {
    //         console.log(err, err.stack);
    //     }
    //     else {
    //         NotificationService.create(user, solutionid, otp ? otp : message, "SMS", event, config, comments);
    //         console.log(data);
    //     }
    // });
  } catch (e) {
    console.log("------------" + e + "------------------------");
  }
};

export default sendSMS;
