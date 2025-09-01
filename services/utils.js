require('dotenv').config();

const axios = require("axios").default;

const jwt = require("jsonwebtoken");

const mysql = require('mysql2');
const mailgun = require("mailgun-js");
const DOMAIN = "dsuinnovate.org";
const mg = mailgun({apiKey: process.env.MAILGUN_API_KEY, domain: DOMAIN});
const { v4: uuidv4 } = require('uuid');


exports.sendPasswordResetEmail = (to, name, reset_link)=>{

  let payload = {
    from: "DSU Innovate <admin@dsuinnovate.org>",
    to: [to],
    subject: "Reset your password (DSU Innovation Day)",
    template: "password reset",
	  'h:X-Mailgun-Variables': JSON.stringify({firstName: name, reset_link:reset_link})
  };
  
  console.log('Sending email', payload);

  return new Promise(function(resolve, reject) {

    mg.messages().send(payload, function (error, body) {

      if(error) reject(error);
      resolve(body);

    });
      
  });
 
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

        //console.log('Decoded token was ', decoded);

        if(decoded.type==='USER'){

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

        }else if(decoded.type==='SPONSOR'){

          db.Sponsor.findOne(
            { where: { sponsor_id:  decoded.uid},
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


        }
        });

    }

}