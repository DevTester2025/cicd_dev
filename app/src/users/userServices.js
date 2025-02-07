var dbConn = require("../../db/db");
var Users = function (users) {
  this.id = users.id;
  this.username = users.username;
  this.email = users.email;
  this.user_password = users.user_password;
  this.createby = users.createdby;
  this.createdat = users.createddt;
};

Users.create = function (newUser, result) {
  dbConn.query("INSERT INTO users set ?", newUser, function (err, res) {
    if (err) {
      console.log("error: ", err);
      result(err, null);
    } else {
      console.log(res.insertId);
      result(null, res.insertId);
    }
  });
};
Users.findById = function (id, result) {
  dbConn.query("Select * from users where id = ? ", id, function (err, res) {
    if (err) {
      console.log("error: ", err);
      result(err, null);
    } else {
      result(null, res);
    }
  });
};
Users.findAll = function (result) {
  dbConn.query("Select * from users", function (err, res) {
    if (err) {
      console.log("error: ", err);
      result(null, err);
    } else {
      console.log("users : ", res);
      result(null, res);
    }
  });
};
Users.update = function (id, users, result) {
  dbConn.query(
    "UPDATE users SET id=?,username=?,email=?,user_password=?, createby=?, createddt=?WHERE id = ?",
    [
      users.id,
      users.username,
      users.username,
      users.user_password,
      users.createdby,
      users.createddt,
    ],
    function (err, res) {
      if (err) {
        console.log("error: ", err);
        result(null, err);
      } else {
        result(null, res);
      }
    }
  );
};
Users.delete = function (id, result) {
  dbConn.query("DELETE FROM users WHERE id = ?", [id], function (err, res) {
    if (err) {
      console.log("error: ", err);
      result(null, err);
    } else {
      result(null, res);
    }
  });
};
module.exports = Users;
