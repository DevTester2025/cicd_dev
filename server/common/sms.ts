"use strict";
export class SMS {
  region = "eu-central-1";
  accessKeyId = process.env.ACCESS_KEY_ID;
  secretAccessKey = process.env.SECRET_ACCESS_KEY;
}
export const smsConfig = new SMS();
