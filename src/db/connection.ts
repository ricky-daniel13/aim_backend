import mysql, {Connection, ConnectionOptions } from 'mysql2';
function dbConn(): Connection {
  const access: ConnectionOptions = {
    host: process.env.MYSQL_URL,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB,
  };
  const dbConn = mysql.createConnection(access);
  dbConn.connect(function (err) {
    if (err) {
      console.log("DATABASE ERROR: ", err);
      throw new Error("Database connection error");
    }
  });
  return dbConn;
}
export default dbConn;