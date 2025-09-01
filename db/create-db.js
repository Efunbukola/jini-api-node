let mysql = require('mysql2');
require('dotenv').config({path : '../.env'});

let con = mysql.createConnection({
  host: process.env.MYSQL_URL,
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD
});

con.connect(function(err) {

  console.log(err);

  if (err) throw err;

  console.log("Connected!");

  con.query("CREATE DATABASE jini_app", function (err, result) {
    if (err) throw err;
    console.log("Database created");
  });

});