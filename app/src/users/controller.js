const users = require("../users/userServices");

exports.findAll = function (req, res) {
  users.findAll(function (err, users) {
    if (err) res.send(err);
    console.log("res", users);
    res.send(users);
  });
};

exports.create = function (req, res) {
  users.create(req.body, function (err, users) {
    if (err) res.send(err);
    res.json({ message: "User added successfully!", data: users });
  });
};

exports.findById = function (req, res) {
  users.findById(req.params.id, function (err, users) {
    if (err) res.send(err);
    res.json(users);
  });
};

exports.update = function (req, res) {
  users.update(req.params.id, req.body, function (err, users) {
    if (err) res.send(err);
    res.json({ message: "users successfully updated", data: users });
  });
};

exports.delete = function (req, res) {
    users.delete(req.params.id, function (err, users) {
    if (err) res.send(err);
    res.json({ message: "users successfully deleted" });
  });
};
