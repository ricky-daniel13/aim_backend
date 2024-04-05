'use strict';
const mysql = require('mysql2');
function dbConn(){
  //local mysql db connection
  const dbConn = mysql.createConnection({
    host: process.env.MYSQL_URL,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB,
  });
  dbConn.connect(function (err) {
    if (err) {
      console.log("DATABASE ERROR: ", err);
      throw new Error("Database connection error");
    }
  });
  return dbConn;
}
module.exports = dbConn;