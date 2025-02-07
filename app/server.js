const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 3000;

const mysql = require("mysql");

app.use(bodyParser.json());

const cors = require("cors");
var corsOptions = {
  origin: "http://localhost:4200",
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

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

const UsersRoutes = require('./src/users/router')
app.use('/api/users', UsersRoutes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
