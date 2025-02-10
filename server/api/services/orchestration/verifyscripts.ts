import * as fs from "fs";
import * as path from "path";

export default function VerifyScripts(scripts: string[]): Promise<boolean> {
  console.log("Tryinh to verify::::::::::::::::");
  console.log(scripts);

  return new Promise((resolve, reject) => {
    let p: Promise<boolean>[] = [];

    scripts.forEach((pt) => {
      p.push(
        new Promise((resolve, reject) => {
          fs.stat(pt, function (err, stat) {
            if (err == null) {
              resolve(true);
            } else if (err.code === "ENOENT") {
              reject(false);
            } else {
              reject(false);
            }
          });
        })
      );
    });

    Promise.all(p)
      .then((exists) => {
        resolve(true);
      })
      .catch((err) => {
        reject(false);
      });
  });
}
