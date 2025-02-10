import { messages as validMsg } from "../messages";
import { constants } from "../constants";
import { AppError } from "../appError";
import LokiService from "../../api/services/logging/loki.service";

export class CustomValidation {
  /**
   *This function used to validate string value.
   *
   *@name isMandatoryString
   *
   *@param inputvalue, columnname, res, strlimitmin, strlimitmax
   *@return boolean
   */
  isMandatoryString(
    inputvalue: any,
    columnname: any,
    strlimitmin: any,
    strlimitmax: any
  ) {
    if (this.isEmptyValue(inputvalue)) {
      this.errorResponse(columnname, validMsg.EMPTY);
    } else if (
      inputvalue.length < strlimitmin ||
      inputvalue.length > strlimitmax
    ) {
      this.errorResponse(columnname, validMsg.LIMIT);
    } else {
      return true;
    }
  }

  /**
   *This function used to validate string value.
   *
   *@name isOptionalString
   *
   *@param inputvalue, columnname, res, strlimitmin, strlimitmax
   *@return boolean
   */
  isOptionalString(
    inputvalue: string,
    columnname: string,
    strlimitmin: number,
    strlimitmax: number
  ) {
    if (this.isEmptyValue(inputvalue)) {
      return true;
    } else {
      this.isMandatoryString(inputvalue, columnname, strlimitmin, strlimitmax);
    }
  }

  /**
   *This function used to validate long value.
   *
   *@name isMandatoryLong
   *
   *@param inputvalue, columnname, res, strlimitmin, strlimitmax
   *@return boolean
   */
  isMandatoryLong(
    inputvalue: any,
    columnname: string,
    strlimitmin: number,
    strlimitmax: number
  ) {
    if (this.isEmptyValue(inputvalue)) {
      this.errorResponse(columnname, validMsg.EMPTY);
    } else if (
      inputvalue.length < strlimitmin ||
      inputvalue.length > strlimitmax
    ) {
      this.errorResponse(columnname, validMsg.LIMIT);
    } else if (typeof Number(inputvalue) !== "number") {
      this.errorResponse(columnname, validMsg.NUM);
    } else if (inputvalue % 1 !== 0) {
      this.errorResponse(columnname, validMsg.NUM);
    } else {
      return true;
    }
  }

  /**
   *This function used to validate long value.
   *
   *@name isOptionalLong
   *
   *@param inputvalue, columnname, res, strlimitmin, strlimitmax
   *@return boolean
   */
  isOptionalLong(
    inputvalue: any,
    columnname: string,
    strlimitmin: number,
    strlimitmax: number
  ) {
    if (this.isEmptyValue(inputvalue)) {
      return true;
    } else {
      this.isMandatoryLong(inputvalue, columnname, strlimitmin, strlimitmax);
    }
  }

  /**
   *This function used to validate decimal value.
   *
   *@name isMandatoryDecimal
   *
   *@param inputvalue, columnname, res
   *@return boolean
   */
  isMandatoryDecimal(inputvalue: any, columnname: string) {
    if (this.isEmptyValue(inputvalue)) {
      this.errorResponse(columnname, validMsg.EMPTY);
    } else if (typeof Number(inputvalue) !== "number") {
      this.errorResponse(columnname, validMsg.NUM);
    } else if (parseFloat(inputvalue) !== inputvalue) {
      this.errorResponse(columnname, validMsg.DECIMAL);
    } else {
      return true;
    }
  }

  /**
   *This function used to validate decimal value.
   *
   *@name isOptionalDecimal
   *
   *@param inputvalue, columnname, res
   *@return boolean
   */
  isOptionalDecimal(inputvalue: any, columnname: string) {
    if (this.isEmptyValue(inputvalue)) {
      return true;
    } else {
      this.isMandatoryDecimal(inputvalue, columnname);
    }
  }

  /**
   *This function used to validate date value.
   *
   *@name isMandatoryDate
   *
   *@param inputvalue, columnname, res
   *@return boolean
   */
  isMandatoryDate(inputvalue: string, format: string, columnname: string) {
    let dtRegex;
    if (format === "YYYY-MM-DD") {
      dtRegex = new RegExp("/\bd{4}[/-]d{1,2}[/-]\bd{1,2}$\b/");
    } else {
      dtRegex = new RegExp(
        "/\bd{4}[/-]d{1,2}[/-]\bd{1,2} (0d|1d|2[0-3]):[0-5]d:[0-5]d$\b/"
      );
    }
    let result = new Date(Date.parse(inputvalue));
    console.log(result);
    if (this.isEmptyValue(inputvalue)) {
      this.errorResponse(columnname, validMsg.EMPTY);
    }
    if (null == result || undefined === result) {
      this.errorResponse(columnname, validMsg.DATE);
    } else {
      return true;
    }
  }

  /**
   *This function used to validate date value.
   *
   *@name isOptionalDate
   *
   *@param inputvalue, columnname, res
   *@return boolean
   */
  isOptionalDate(inputvalue: string, format: string, columnname: string) {
    if (this.isEmptyValue(inputvalue)) {
      return true;
    } else {
      this.isMandatoryDate(inputvalue, format, columnname);
    }
  }

  /**
   *This function used to validate email id.
   *
   *@name isMandatoryEmail
   *
   *@param inputvalue, columnname, res , strlimitmin, strlimitmax
   *@return boolean
   */
  isMandatoryEmail(
    inputvalue: any,
    columnname: any,
    strlimitmin: any,
    strlimitmax: any
  ) {
    let mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (this.isEmptyValue(inputvalue)) {
      this.errorResponse(columnname, validMsg.EMPTY);
    } else if (
      inputvalue.length < strlimitmin ||
      inputvalue.length > strlimitmax
    ) {
      this.errorResponse(columnname, validMsg.LIMIT);
    } else if (!mailformat.test(inputvalue)) {
      this.errorResponse(columnname, validMsg.EMAIL);
    } else {
      return true;
    }
  }
  /**
   *This function used to validate mail id.
   *
   *@name isOptionalEmail
   *
   *@param inputvalue, columnname, res , strlimitmin, strlimitmax
   *@return boolean
   */

  isOptionalEmail(
    inputvalue: any,
    columnname: any,
    strlimitmin: number,
    strlimitmax: number
  ) {
    if (this.isEmptyValue(inputvalue)) {
      return true;
    } else {
      this.isMandatoryEmail(inputvalue, columnname, strlimitmin, strlimitmax);
    }
  }

  /**
   *Loosely validate a URL `string`.
   *
   *@param {String} string
   *@return {Boolean}
   */
  isValidURL(data: string) {
    let matcher =
      /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g;
    return matcher.test(data);
  }

  /**
   *This function used to validate  whether it contain possible values.
   *
   *@name isMandatoryContainValues
   *
   *@param inputvalue, columnname, possibleValues, res
   *@return boolean
   */

  isMandatoryContainValues(
    inputvalue: any,
    columnname: any,
    possibleValues: any
  ) {
    if (this.isEmptyValue(inputvalue)) {
      this.errorResponse(columnname, validMsg.EMPTY);
    } else if (!possibleValues.includes(inputvalue)) {
      this.errorResponse(columnname, validMsg.NUM);
    } else {
      return true;
    }
  }

  /**
   *This function used to validate  whether it contain possible values.
   *
   *@name isOptionalContainValues
   *
   *@param inputvalue, columnname, possibleValues, res
   *@return boolean
   */

  isOptionalContainValues(
    inputvalue: any,
    columnname: any,
    possibleValues: any
  ) {
    if (this.isEmptyValue(inputvalue)) {
      return true;
    } else {
      this.isMandatoryContainValues(inputvalue, columnname, possibleValues);
    }
  }

  isEmptyValue(inputvalue: any) {
    if (
      inputvalue === null ||
      inputvalue === undefined ||
      inputvalue.length === 0
    ) {
      return true;
    }
    return false;
  }

  isEmptyArray(inputvalue: any) {
    if (
      inputvalue === null ||
      inputvalue === undefined ||
      inputvalue.length < 1 ||
      !Array.isArray(inputvalue)
    ) {
      return true;
    }
    return false;
  }

  errorResponse(columnname: string, msg: string) {
    throw new AppError(columnname + msg);
  }

  generateAppError(e: any, response: any, res: any, req: any) {
    response.status = false;
    let request = JSON.stringify({
      baseUrl: req.url,
      body: req.body,
      params: req.params,
      query: req.query,
      headers: req.headers,
    });
    if (e instanceof AppError) {
      response.code = 204;
      response.message = e.message;
      res.send(response);
    } else {
      if (!this.isEmptyValue(e.name) && e.name === constants.SEQUELIZE_ERROR) {
        response.message = constants.PERMISSION_DENIED;
        response.code = 403;
        if (
          e.message.split(":")[0] === constants.SEQUELIZE_ER_BAD_FIELD_ERROR
        ) {
          response.message = constants.UNKNOWN_COLUMN;
          response.code = 200;
          res.status(200).send(response);
        } else {
          res.status(203).send(response);
        }
      } else {
        response.code = 500;
        response.message = validMsg.INTERNAL_ERROR;
        res.status(500).send(response);
      }
    }
    LokiService.createLog(response, "ERROR", request);
  }
  generateCustomResponse(response: any, res: any, req: any) {
    let request = JSON.stringify({
      baseUrl: req.url,
      body: req.body,
      params: req.params,
      query: req.query,
      headers: req.headers,
    });
    if (response.error || response.err) {
      response.code = 500;
      LokiService.createLog(response, "ERROR", request);
    } else {
      response.code = 200;
      LokiService.createLog(response, "INFO", request);
    }
    res.send(response);
  }
  generateSuccessResponse(
    data: any,
    response: any,
    type: string,
    res: any,
    req: any
  ) {
    let request = JSON.stringify({
      baseUrl: req.url,
      body: req.body,
      params: req.params,
      query: req.query,
      headers: req.headers,
    });
    if (null == data || data === undefined || data.length < 1) {
      response.status = false;
      response.code = 201;
      if (constants.RESPONSE_TYPE_SAVE === type) {
        response.message = validMsg.SAVE_FAILED;
      } else if (constants.RESPONSE_TYPE_UPDATE === type) {
        response.message = validMsg.UPDATE_FAILED;
      } else if (constants.RESPONSE_TYPE_DELETE === type) {
        response.message = validMsg.DELETE_FAILED;
      } else if (constants.RESPONSE_TYPE_CUSTOM === type) {
        response.message = response.message;
      } else {
        response.message = validMsg.EMPTY_LIST;
      }
      LokiService.createLog(response, "INFO", request);
      res.send(response);
    } else {
      response.status = true;
      response.code = 200;
      if (constants.RESPONSE_TYPE_SAVE === type) {
        response.message = validMsg.SAVE_SUCCESS;
      } else if (constants.RESPONSE_TYPE_UPDATE === type) {
        response.message = validMsg.UPDATE_SUCCESS;
      } else if (constants.RESPONSE_TYPE_DELETE === type) {
        response.message = validMsg.DELETE_SUCCESS;
      } else if (constants.RESPONSE_TYPE_CUSTOM === type) {
        response.message = response.message;
      } else {
        response.message = validMsg.LIST_FOUND;
      }
      response.data = data;
      LokiService.createLog(response, "INFO", request);
      res.send(response);
    }
  }
  generateSuccessResponseWithCount(data, response, res, req) {
    let request = JSON.stringify({
      baseUrl: req.url,
      body: req.body,
      params: req.params,
      query: req.query,
      headers: req.headers,
    });
    if (data.count === 0) {
      response.status = false;
      response.code = 201;
      response.message = validMsg.EMPTY_LIST;
      res.send(response);
    } else {
      response.status = true;
      response.code = 200;
      response.count = data.count;
      response.data = data.rows;
      response.message = validMsg.LIST_FOUND;
      res.send(response);
    }
    LokiService.createLog(response, "INFO", request);
  }
  generateFailureResponse(response: any, type: string, res: any, req: any) {
    const reply = {
      status: false,
      code: 500,
      message: validMsg.FAILED,
    };
    let request = JSON.stringify({
      baseUrl: req.url,
      body: req.body,
      params: req.params,
      query: req.query,
      headers: req.headers,
    });
    try {
      if (response.message != null && response.message !== undefined) {
        reply.message = response.message;
      } else if (
        constants.RESPONSE_TYPE_SAVE === type ||
        constants.RESPONSE_TYPE_UPDATE === type
      ) {
        reply.message = validMsg.FAILED;
      } else {
        reply.message = validMsg.EMPTY_LIST;
      }
      LokiService.createLog(reply, "INFO", request);
      res.send(reply);
    } catch (e) {
      LokiService.createLog(reply, "ERROR", request);
      res.send(reply);
    }
  }
  generateErrorMsg(msg: string, res: any, code: any, req: any) {
    let response = {} as any;
    response.status = false;
    response.code = code;
    response.message = msg;
    let request = JSON.stringify({
      baseUrl: req.url,
      body: req.body,
      params: req.params,
      query: req.query,
      headers: req.headers,
    });
    LokiService.createLog(response, "ERROR", request);
    if (code) {
      res.statusCode = code;
      res.status(code).send(response);
    } else {
      res.send(response);
    }
  }
  generateSuccessMsg(msg: string, data: any, res: any, code: any, req: any) {
    let response = {} as any;
    let request = JSON.stringify({
      baseUrl: req.url,
      body: req.body,
      params: req.params,
      query: req.query,
      headers: req.headers,
    });
    response.status = true;
    response.code = code;
    response.message = msg;
    response.data = data;
    LokiService.createLog(response, "INFO", request);
    if (code) {
      res.statusCode = code;
      res.status(code).send(response);
    } else {
      res.send(response);
    }
  }
}
export const customValidation = new CustomValidation();
