import { readFile } from "fs";
import * as path from "path";

export default function genCode() {
  return new Promise((resolve, reject) => {
    readFile(path.join(__dirname, "code.js"), "utf-8", (err, data) => {
      if (err) reject(err);

      resolve(
        Buffer.from(
          data.replace(
            "{{test}}",
            "['https://google.com','https://duckduckgo.com']"
          ),
          "utf-8"
        ).toString("base64")
      );
    });
  });
}
