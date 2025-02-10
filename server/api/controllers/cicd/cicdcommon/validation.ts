import { AppError } from "../../../../common/appError";
import { messages as validMsg } from "../../../../common/messages";
import * as moment from "moment";
import {constants} from "../../../../common/constants";


export class Validation {

  isMandatoryDate(inputvalue: any, format: string, columnname: string) {
  if(inputvalue !=null || inputvalue != undefined){
    if (this.isEmptyValue(inputvalue)) {
      this.errorResponse(columnname, validMsg.EMPTY);
    }
    if (!this.isValidDateFormat(inputvalue)) {
      this.errorResponse(columnname, validMsg.DATE_FORMAT);
    } 
    let result = new Date(Date.parse(inputvalue));
    console.log(result);
    

    if ('Invalid Date' === result.toString() ) {
      this.errorResponse(columnname, validMsg.DATE_FORMAT);
    } else {
      return true;
    }
  }
     
  
  }
  errorResponse(columnname: string, msg: string) {
    throw new AppError(columnname + msg);
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

  isValidDateFormat(dateString) {
    return moment(dateString, 'YYYY-MM-DD', true).isValid();
}
 ValidRange(date1,date2,columnname)
{
  if(date1!=null||date1 != undefined || date2!=null || date2!= undefined ){
  let startDate = new Date(date1);
  let endDate = new Date(date2);
  console.log(startDate.setHours(0,0,0) < endDate.setHours(23,59,59));
  const isValidDateRange = startDate.getTime() < endDate.getTime();
  if (!isValidDateRange) {
    this.errorResponse(columnname, validMsg.DATE_RANGE);
  }
}else{
  return true;
}  
}

isMandatoryURL(
  inputvalue: any,
  columnname: any,
  strlimitmin: any,
  strlimitmax: any
) {
  let urlformat = constants.CICD_URL;
  
  if (this.isEmptyValue(inputvalue)) {
    this.errorResponse(columnname, validMsg.EMPTY);
  } else if (
    inputvalue.length < strlimitmin ||
    inputvalue.length > strlimitmax
  ) {
    this.errorResponse(columnname, validMsg.LIMIT);
  } 
  else if (!urlformat.test(inputvalue)) {
    this.errorResponse(columnname, validMsg.URL);
  }
   else {
    return true;
  }
}

isMandatoryPassword(
  inputvalue: any,
  columnname: any,
  strlimitmin: any,
  strlimitmax: any
) {
  let passwordformat = /^(?=.*\d)(?=.*[A-Z])(?=.*\W).{8,}$/; 


  if (this.isEmptyValue(inputvalue)) {
    this.errorResponse(columnname, validMsg.EMPTY);
  } else if (
    inputvalue.length < strlimitmin ||
    inputvalue.length > strlimitmax
  ) {
    this.errorResponse(columnname, validMsg.LIMIT);
  } else if (!passwordformat.test(inputvalue)) {
    this.errorResponse(columnname, validMsg.PASSWORD);
  } else {
    return true;
  }
}

isMandatoryScript(inputvalue, columnname) {
  // Check if the input value is empty or consists only of spaces
  if (this.isEmptyValue(inputvalue)) {
    this.errorResponse(columnname, validMsg.EMPTY);
  } 
  else if (/^\s*$/.test(inputvalue)) {
    this.errorResponse(columnname, validMsg.EMPTY);
  } 
  else if (/^"\s+"$/.test(inputvalue.trim()) || /^'\s+'$/.test(inputvalue.trim())|| inputvalue.trim() === '""' || inputvalue.trim() === "''") {
    this.errorResponse(columnname, validMsg.EMPTY);
  } else {
    return true;
  }
}

canaryPercentage (inputvalue, columnname) {
  const percentage = Number(inputvalue);
  if (this.isEmptyValue(inputvalue)) {
    this.errorResponse(columnname, validMsg.EMPTY);
  } 
  else if (isNaN(percentage)) {
    this.errorResponse(columnname, validMsg.NUMBER);
  }
  else if (percentage < 1 || percentage > 100) {
    this.errorResponse(columnname, validMsg.FREQUENCY);
  }else {
    return true;
  }
}

isString (inputvalue, columnname) {
  if (this.isEmptyValue(inputvalue)) {
    this.errorResponse(columnname, validMsg.EMPTY);
  } 
  else if (typeof inputvalue !== 'string') {
    this.errorResponse(columnname, validMsg.STRING);
  }else {
    return true;
  }
}

isNumber(inputvalue, columnname) {
  if (this.isEmptyValue(inputvalue)) {
    this.errorResponse(columnname, validMsg.EMPTY);
  } 
  else if (typeof inputvalue !== 'number' || isNaN(inputvalue)) {
    this.errorResponse(columnname, validMsg.NUMBER);
  }
}

isArray(inputvalue, columnname) {
  if (this.isEmptyArray(inputvalue)) {
    this.errorResponse(columnname, validMsg.EMPTY);
  } 
}
isMandatoryField(inputvalue: any, columnname: string) {
  if (this.isEmptyValue(inputvalue)) {
    this.errorResponse(columnname, validMsg.EMPTY);
  } else {
    return true;
  }
}

retryMandatoryField (inputvalue, columnname) {
  const rertyCount = Number(inputvalue);
  if (this.isEmptyValue(inputvalue)) {
    this.errorResponse(columnname, validMsg.EMPTY);
  }
  else if (isNaN(rertyCount)) {
    this.errorResponse(columnname, validMsg.NUMBER);
  }
  else {
    return true;
  }
}

ValidIP(inputvalue: string, columnname: string): boolean {
  // Check if the input value is empty
  if (this.isEmptyValue(inputvalue)) {
    this.errorResponse(columnname, validMsg.EMPTY);
  }

  //For IPv4 validation
  const ipv4Regex =
    /^(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)$/;

  // Validate against IPv4 regex
  if (!ipv4Regex.test(inputvalue)) {
    this.errorResponse(columnname, validMsg.IP_INVALID);
  }

   if (/^"\s+"$/.test(inputvalue.trim()) || /^'\s+'$/.test(inputvalue.trim())|| inputvalue.trim() === '""' || inputvalue.trim() === "''") {
    this.errorResponse(columnname, validMsg.EMPTY);
  }

  return true; // If validation passes
}

isValidRemoteDirectory(inputvalue: string, columnname: string) {
  // Check if the value is empty
  if (this.isEmptyValue(inputvalue)) {
      this.errorResponse(columnname, validMsg.EMPTY);
  }
  // Regex to check valid directory format
  else if (!/^\/([a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*)?$/.test(inputvalue)) {
      this.errorResponse(columnname, validMsg.INVALID_DIR);
  }
  else {
      return true;
  }
}

isvalidate(inputvalue:string, columnname:string) {
  if (this.isEmptyValue(inputvalue)) {
    this.errorResponse(columnname, validMsg.EMPTY);
}
if (/^"\s+"$/.test(inputvalue.trim()) || /^'\s+'$/.test(inputvalue.trim())|| inputvalue.trim() === '""' || inputvalue.trim() === "''") {
  this.errorResponse(columnname, validMsg.EMPTY);
}
}
}
export const basicValidation = new Validation();