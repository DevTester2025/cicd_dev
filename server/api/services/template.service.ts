import CommonService from "../services/common.service";
import db from "../models/model";
import { constants } from "../../common/constants";
import _ = require("lodash");

const getTemplate = async (title: string, replacements: any) => {
    const templateData = await CommonService.getData(
      {
        where: {
          title: title,
          status: constants.STATUS_ACTIVE,
        },
      },
      db.Templates
    );
  
    const template = templateData.template;
    let emailContent = template;
  
    _.map(replacements, (value, key) => {
      emailContent = emailContent.split(key).join(value);
    });
  
    return emailContent;
  };
export default getTemplate;
