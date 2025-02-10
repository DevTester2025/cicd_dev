import db from "../models/model";
import { constants } from "../../common/constants";
import CommonService from "../services/common.service";
import sendMail from "../services/email";
import sendSMS from "../services/sms-service";
import emailTemplate from "../../common/emailtemplate";
class NotificationService {
  create(
    userinstance: any,
    solutionid: string,
    content: any,
    type: string,
    event: any,
    config: any,
    comments: any,
    title: String,
    contenttype: String
  ) {
    try {
      let ntfObj = {
        tenantid: userinstance.tenantid,
        userid: userinstance.userid,
        solutionid: solutionid,
        eventtype: event,
        modeofnotification: type,
        title,
        contenttype,
        configuration: config,
        notes: comments,
        content: content,
        createddt: new Date(),
        createdby: constants.DEFAULT_NAME,
        lastupdateddt: new Date(),
        updatedby: constants.DEFAULT_NAME,
      };
      db.notification
        .create(ntfObj)
        .then((result: any) => {
          console.log(`Notification Saved Successfully ${result}`);
        })
        .catch((error) => {
          console.log(error);
        });
    } catch (e) {
      console.log(e);
    }
  }
  getNotificationSetup(condition, mapObj, subject, comments) {
    CommonService.getAllList({ where: condition }, db.notificationsetup)
      .then((ntfdata: any) => {
        if (ntfdata) {
          ntfdata = JSON.parse(JSON.stringify(ntfdata));
          for (let i of ntfdata) {
            CommonService.getAllList(
              { where: { userid: { $in: JSON.parse(i.receivers) } } },
              db.User
            )
              .then((list) => {
                list = JSON.parse(JSON.stringify(list));
                for (let j of list) {
                  //if email
                  if (i.ntftype == constants.NOTIFICATION_TYPES[0]) {
                    mapObj["{{to_user_name}}"] = j.fullname;
                    mapObj["\n"] = "<br/>";
                    mapObj["\t"] = "&emsp;&emsp;";
                    mapObj["↵"] = "<br/>";
                    mapObj["  "] = "&emsp;&emsp;";
                    var re = new RegExp(Object.keys(mapObj).join("|"), "gi");
                    let template = i.template.replace(re, function (matched) {
                      return mapObj[matched];
                    });
                    template = emailTemplate.replace(
                      "{{body_content}}",
                      template
                    );
                    if (j.email) {
                      sendMail(
                        j.email,
                        subject,
                        template,
                        j,
                        comments,
                        null,
                        null,
                        "Notification created for user " + j.fullname
                      );
                    }
                  }
                  //if SMS
                  else if (i.ntftype == constants.NOTIFICATION_TYPES[1]) {
                    mapObj["\n"] = "";
                    mapObj["\t"] = "";
                    mapObj["↵"] = "";
                    mapObj["  "] = "";
                    var re = new RegExp(Object.keys(mapObj).join("|"), "gi");
                    let template = i.template.replace(re, function (matched) {
                      return mapObj[matched];
                    });
                    console.log(template);
                    if (j.phone) {
                      sendSMS(
                        j.secondaryphoneno,
                        template,
                        j,
                        comments,
                        null,
                        null,
                        "Notification created for user " + j.fullname
                      );
                    }
                  }
                }
              })
              .catch((error: Error) => {
                console.log(error);
              });
          }
        }
      })
      .catch((error: Error) => {
        console.log(error);
      });
  }
}
export default new NotificationService();
