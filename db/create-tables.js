/*
let mysql = require('mysql2');

let con = mysql.createConnection({
  host: "dsu-main-db.c5y6mo4w2tvo.us-east-2.rds.amazonaws.com",
  user: "admin",
  password: "!Howard214",
  database: "dsu_innovate",
  database: "dsu_innovate"
});

con.connect(function(err) {

  if (err) throw err;

  console.log("Connected!");

  let sql = `CREATE TABLE IF NOT EXISTS teams(
    team_id INT AUTO_INCREMENT PRIMARY KEY,
    team_name VARCHAR(255),
    team_logo_url VARCHAR(255),
    team_username VARCHAR(255),
    team_email VARCHAR(255),
    innovation_category VARCHAR(255),
    team_password VARCHAR(255),
    team_type VARCHAR(255),
    secret_question VARCHAR(255),
    secret_answer VARCHAR(255),
    verification_code VARCHAR(255),
    school_id INT,
    alt_school_name VARCHAR(255),
    advisor_name VARCHAR(255),
    UNIQUE (team_username))`;

  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Table created");
  });

  sql = `CREATE TABLE IF NOT EXISTS schools (
    school_id INT AUTO_INCREMENT PRIMARY KEY,
    school_type VARCHAR(255),
    state VARCHAR(255),
    school_name VARCHAR(255))`;

  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Table created");
  });

  sql = `CREATE TABLE IF NOT EXISTS team_members (
    team_member_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone_number VARCHAR(255),
    email VARCHAR(255),
    team_id INT,
    grade_level VARCHAR(255),
    photo_url VARCHAR(255))`;

  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Table created");
  });

  sql = `CREATE TABLE IF NOT EXISTS bad_login_attempts (
    team_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`;

  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Table created");
  });

  sql = `CREATE TABLE IF NOT EXISTS submissions (
    submission_id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`;

  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Table created");
  });


});
*/