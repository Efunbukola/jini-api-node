require('dotenv').config();

const axios = require("axios").default;

const jwt = require("jsonwebtoken");

const mailgun = require("mailgun-js");
const DOMAIN = "dsuinnovate.org";
const { v4: uuidv4 } = require('uuid');

const mysql = require('mysql2');


let mysql_connection = mysql.createPool({
  host: process.env.MYSQL_URL,
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_SCRIBAR_DBNAME,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
  idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

exports.scribar_mysql_connection = mysql_connection;




exports.verifyPassword = async(plainPassword, storedHash) => {
  try {
    const match = await bcrypt.compare(plainPassword, storedHash);
    return match; // true if valid, false otherwise
  } catch (err) {
    console.error("Error comparing:", err);
    return false;
  }
}

exports.sendPasswordResetEmail = (to, name, reset_link)=>{
}


//Sequelize
const db = require('../db/sequelize.js');
const { alwaysQuoteIdentifiers } = require('@sequelize/core/_non-semver-use-at-your-own-risk_/utils/deprecations.js');

db.sequelize.sync({ force: false })
.then(() => {
    console.log(`Database & tables created!`);
}).catch(error=>console.log(error));

exports.mysql_connection={}; 



exports.randomCode = (length) => {
  return Math.floor(Math.pow(10, length-1) + Math.random() * (Math.pow(10, length) - Math.pow(10, length-1) - 1));
};

exports.generateUniqueId = () => {
  return uuidv4();
};



//Verify Auth Middleware
exports.verifyAuth = (req, res, next) => {

  const token = req.headers.authorization;

  if (!token) {

    console.log('No token sent')

    req['isAuthenticated']=false;

    next()

  }else{

      console.log('Token was', token);

      jwt.verify(token.replace('Bearer ', ''),
        process.env.JWT_KEY,
        (err, decoded) => {

        if (err) {

          console.log(err);
          res.status(401);
          res.send("Token needs refreshing");
          return;

        }

        console.log('Decoded token was ', decoded);

          db.User.findOne(
            {
              where: { user_id:  decoded.uid},
              include:  { all: true }
            }).then((user)=>{

                if(user){

                  req['isAuthenticated']=true;
                  req['authenticatedUserId'] = decoded.uid;
                  req['userData']=user;
                  
                  next();
                  
                }else{
                  res.status(401);
                  res.send("Token needs refreshing");
                }

            }).catch((error)=>{

              res.status(401);
              res.send("Token needs refreshing");

            });

       
        });

    }

}