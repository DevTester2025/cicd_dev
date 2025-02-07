const mysql = require("mysql");
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "chat-application",
});
db.connect(function (e) {
    if (e) {
      throw e;
    } else {
      console.log("DataBase connected");
    }
  });
module.exports = db;
