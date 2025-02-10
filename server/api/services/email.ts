import * as AWS from "aws-sdk";
import { EmailConfig } from "../../common/email";
import * as nodemailer from "nodemailer";
const sendMail = async function (
  to: string | string[],
  subject: string,
  html: string,
  user: any,
  event: any,
  solutionid: any,
  config: any,
  comments: any,
  otp?
) {
  if (process.env.APP_ENV !== "demo") {
    const AWS_SES = new AWS.SES({
      accessKeyId: process.env.APP_AWS_ACCESS,
      secretAccessKey: process.env.APP_AWS_SECRET,
      region: process.env.APP_AWS_EMAIL_REGION,
    });

    try {
      const response = await AWS_SES.sendEmail({
        Source: EmailConfig.AUTH_MAIL_ID,
        Destination: {
          ToAddresses: typeof to == "string" ? [to] : to,
        },
        ReplyToAddresses: [],
        Message: {
          Body: {
            Html: {
              Charset: "UTF-8",
              Data: html,
            },
          },
          Subject: {
            Charset: "UTF-8",
            Data: subject,
          },
        },
      }).promise();
      console.log("Email response >>>>>>>>>>>>>>>>>.");
      console.log(response);
      console.log(to);
      // NotificationService.create(
      //   user,
      //   solutionid,
      //   otp ? otp : html,
      //   "EMAIL",
      //   event,
      //   config,
      //   comments,
      //   subject,
      //   "Text"
      // );
    } catch (error) {
      console.log("Error sending email .>>>>>>>>>");
      console.log(error);
    }
  }
  if (process.env.APP_ENV === "demo") {
    var smtpTransport: any = null;

    smtpTransport = nodemailer.createTransport({
      auth: {
        user: EmailConfig.AUTH_MAIL_ID,
        pass: EmailConfig.AUTH_MAIL_PWD,
      },
      secure: true,
      port: 465, //
      host: EmailConfig.SMTPHOSTNAME,
    });
    var mailOptions = {
      from: EmailConfig.DONOT_RLYMAIL_ID,
      to: to,
      subject: subject,
      html: html,
    };
    smtpTransport.sendMail(mailOptions, function (error: any, info: any) {
      console.log("Email response >>>>>>>>>>>>>>>>>.");
      console.log("error"), console.log(error);

      if (error) {
        console.error(`${error}`);

        return error;
      } else {
        console.info(`Email Sent ${JSON.stringify(info)}`);

        return info;
        //   NotificationService.create(user, solutionid, otp ? otp : html, "EMAIL", event, config, comments);
      }
      if (smtpTransport !== undefined) {
        smtpTransport.close();
      }
    });
  }
};

export default sendMail;
