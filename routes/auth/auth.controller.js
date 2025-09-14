
const utils = require("../../services/utils");
const passwordValidator = require('password-validator');
const  bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const newrelic = require('newrelic');
const db = require('../../db/sequelize.js');
const { Op } = require('sequelize');

const axios = require('axios');
const endpoint = "https://scribar.lrs.io/xapi/statements";
const username = "f734054f-3f80-4c5d-a5b4-e5f8c50262bb";   // from Veracity dashboard
const password = "aec3008c-43c0-4d71-af2a-7df7a23edc0d"; // from Veracity dashboard
const authHeader =
  "Basic " + Buffer.from(`${username}:${password}`).toString("base64");


const LOGIN_ERROR_CODES = {
  USERNAME_NOT_FOUND:1,
  PASSWORD_INVALID:2,
  LOCKED_OUT:3
}

const REGISTER_ERROR_CODES = {
  USERNAME_EXISTS:1,
  GENERIC:2,
}

const ROLES = {
  STUDENT:1,
  INDUSTRY:2
}


exports.registerUser = async (req, res) => {

  if(req.body.email
    && req.body.first_name
    && req.body.last_name
    && req.body.password
    && req.body.country
    && req.body.city
    && req.body.state
    && req.body.country
    && req.body.zip
    && req.body.scribar_product_key
    ){
     
    try {

    let user = req.body;

    //check for existing user
    let exsitingEmail = await db.User.findOne(
      { where: { email: user.email } }
    );

    if(exsitingEmail){
      throw {error:`A user with the email ${user.email} already exists.`};
    }

    let passwordSchema = new passwordValidator();

      passwordSchema
      .is().min(8)                                    // Minimum length 8
      .is().max(100)                                  // Maximum length 100
      .has().uppercase()                              // Must have uppercase letters
      .has().lowercase()                              // Must have lowercase letters
      .has().digits(1)                                // Must have at least 2 digits
      .has().symbols(1)          // Must have at least 1 symbol
      .has().not().spaces()                           // Should not have spaces

      if(!passwordSchema.validate(user.password)){
        throw {error:REGISTER_ERROR_CODES.GENERIC};
      }

      let salt = bcrypt.genSaltSync(10);
      let hash = bcrypt.hashSync(user.password, salt);

      user.password = hash;

      let newCode = utils.randomCode(6);

      //Save to DB
      let newUser = await db.User.create({
        email: user.email,
        password:hash,
        verification_code:newCode,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        country: req.body.country,
        city: req.body.city,
        state: req.body.state,
        zip: req.body.zip,
        scribar_product_key:req.body.scribar_product_key
      });

       await db.UserLearningProfile.create({
        user_id:newUser.user_id
      });


      //generate token
      const token = jwt.sign({ uid: newUser.user_id, type:'USER'},
        process.env.JWT_KEY,
      {
          algorithm: 'HS256',
          allowInsecureKeySizes: true,
          expiresIn: '72 hours', // 72 hours
      });

      newUser['password']='';

      res.status(200);
      res.send({new_user:newUser, auth_token:token});

      }catch(e){

        console.log(e);
        res.status(500);

        if(e.error){
          res.send({error_message:e.error});
        }else{
          res.send({error_message:'Error creating account. Please try again!'});
        }
        
      }

  }else{
    console.log('Missing params');
    res.status(500);
    res.send({error_message:'Error creating account. Please try again!'});
  }

};

exports.getAuthData = async (req, res) => {
  try {
    if (!req.userData) {
      return res.status(401).send({});
    }

    // Never return password
    req.userData.password = '';

    let avatar = {};
    let language = {};
    let skill = {};
    let nursing_level = {};
    let country = {};

    if (req.userData.user_learning_profile) {
      const profile = req.userData.user_learning_profile;

      if (profile.jini_avatar_id) {
        avatar = await db.JiniAvatar.findOne({
          where: { jini_avatar_id: profile.jini_avatar_id },
          include: { all: true }
        });
      }

      if (profile.jini_language_id) {
        language = await db.JiniLanguage.findOne({
          where: { jini_language_id: profile.jini_language_id }
        });
      }

      if (profile.jini_clinical_skill_id) {
        skill = await db.JiniClinicalSkill.findOne({
          where: { jini_clinical_skill_id: profile.jini_clinical_skill_id }
        });
      }

      if (profile.jini_nursing_level_id) {
        nursing_level = await db.JiniNursingLevel.findOne({
          where: { jini_nursing_level_id: profile.jini_nursing_level_id }
        });
      }

      if (profile.jini_country_id) {
        country = await db.JiniCountry.findOne({
          where: { jini_country_id: profile.jini_country_id }
        });
      }
    }

    let ud = {
      ...req.userData.dataValues,
      avatar,
      language,
      skill,
      nursing_level,
      country
    };

    return res.status(200).send(ud);
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: 'Failed to fetch auth data' });
  }
};


exports.getAllNurseLevels= async (req, res) => {

    let levels = await db.JiniNursingLevel.findAll();
    res.status(200);
    res.send(levels);

};

exports.getAllLanguages= async (req, res) => {

    let languages = await db.JiniLanguage.findAll();
    res.status(200);
    res.send(languages);

};

exports.getAllCountries= async (req, res) => {

    let countries = await db.JiniCountry.findAll();
    res.status(200);
    res.send(countries);

};

exports.getAllClinicalSkills = async (req, res) => {

  const [skills, fields]
  = await utils.scribar_mysql_connection.promise().query(`SELECT * FROM task`);

  let clinical_skills = skills.map(s=> { return {jini_clinical_skill_name:s.task_name, jini_clinical_skill_id:s.task_id}})

    res.status(200);
    res.send(clinical_skills);

};

exports.getAllAvatars = async (req, res) => {

    let avatars = await db.JiniAvatar.findAll();
    res.status(200);
    res.send(avatars);

};

exports.editUser = async (req, res) => { 


  const user = req.body;

  try {

    await db.UserLearningProfile.update(
      {
        jini_avatar_id:user.jini_avatar_id,
        jini_language_id:user.jini_language_id,
        jini_clinical_skill_id:user.jini_clinical_skill_id,
        jini_nursing_level_id:user.jini_nursing_level_id
      },
      {where:{
        user_id:req.userData.user_id
      }}
    );

  const statement = {
  "actor": {
    "objectType": "Agent",
    "name": req.userData.first_name,
    "mbox": "mailto:saboorsalaam@gmail.com"
  },
  "verb": {
    "id": "http://adlnet.gov/expapi/verbs/completed",
    "display": { "en-US": "completed" }
  },
  "object": {
    "id": "http://example.com/activities/user-profile",
    "definition": {
      "name": { "en-US": "User Profile Setup" },
      "description": { "en-US": "The user completed setting up their profile in the jini app." }
    },
    "objectType": "Activity"
  },
  "result": {
    "completion": true,
    "success": true,
    "response": "Profile fully completed"
  },
  "timestamp": "2025-09-01T16:00:00Z"
};

    const response = await axios.post(endpoint, statement, {
      headers: {
        "X-Experience-API-Version": "1.0.3",
        "Content-Type": "application/json",
        Authorization: authHeader, // 👈 send Basic Auth
      },
    });

  res.status(200);
  res.send({});

  }catch(e){
    console.log(e);
    res.status(500);
    res.send(e);
  }

};


exports.sendXAPIStatement = async (req, res) => {
  try {
    const statement = req.body;

    const response = await axios.post(endpoint, statement, {
      headers: {
        "X-Experience-API-Version": "1.0.3",
        "Content-Type": "application/json",
        Authorization: authHeader, // 👈 send Basic Auth
      },
    });

    res.status(200).json({
      success: true,
      message: "Statement stored successfully",
      lrsResponse: response.data,
    });
  } catch (err) {
    console.error("❌ Error sending statement:", err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      success: false,
      error: err.response?.data || err.message,
    });
  }
}

// Example GET to pull recent statements
exports.getXAPIStatement = async (req, res) => {
  try {
    const response = await axios.get(endpoint, {
      headers: {
        "X-Experience-API-Version": "1.0.3",
        Authorization: authHeader,
      },
    });

    res.status(200).json(response.data);
  } catch (err) {
    console.error("❌ Error fetching statements:", err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      success: false,
      error: err.response?.data || err.message,
    });
  }
}




exports.checkUserName = async (req, res) => {

  if(req.query.username){

    let username = req.query.username;

      try {
    
      const [teams, fields]
      = await utils.mysql_connection.promise().query(`SELECT * FROM teams WHERE team_username = ?`, [username]);

      if(teams.length){
        throw "Username already exists";
      }

      res.status(200);
      res.send('Username is good');

      }catch(e){

        res.status(500);
        res.send(e);

      }

  }else{

    console.log('Missing params');
    res.status(500);
    res.send({});
    
  }

};

exports.loginUser = async (req, res) => {

  if(req.body.email && req.body.password){

    let email = req.body.email;
    let password = req.body.password;

    try {

    let user = await db.User.findOne(
      { where: { email: email } }
    );
      

    if(!user){
      throw {error:'Error logging in. Please check email and password and try again.'};
    }

    const lockouts = await db.sequelize.query(`SELECT * FROM bad_login_attempts
      WHERE user_id = '${user.user_id}' AND created_at BETWEEN (DATE_SUB(NOW(),INTERVAL 6 MINUTE)) AND NOW() ORDER BY created_at DESC LIMIT 3`, {
      model: db.BadLoginAttempt,
      mapToModel: true,
    });

    console.log('Lockouts found', lockouts);

    if(lockouts.length >= 3){
        console.log('Locked out of account');
        throw {error:LOGIN_ERROR_CODES.LOCKED_OUT}
    }

    const validate = await bcrypt.compare(password, user.password);

    //Password invalid so store bad login attempt
    if (!validate) {
        await db.BadLoginAttempt.create({user_id:user.user_id})
        throw {error:LOGIN_ERROR_CODES.PASSWORD_INVALID}
    }

    user['password']='';
    user.setDataValue('type', 'USER');


    //Password is valid so pass token to client
    const token = jwt.sign({ uid: user.user_id, type:'USER'},
    process.env.JWT_KEY,
    {
      algorithm: 'HS256',
      allowInsecureKeySizes: true,
      expiresIn: '72 hours', // 72 hours
    });

      res.status(200);
      res.send({'auth_token':token, user: user});

      }catch(e){

        console.log(e);
        res.status(500);
        res.send(e);

      }

  }else{

    console.log('Missing params');
    res.status(500);
    res.send({});
    
  }

};

/*
exports.loginScribarUser = async (req, res) => {

  if(req.body.email && req.body.password){

    let email = req.body.email;

    //check for email in our database, if its already in here the return an error
    //if its not in there, then check scribar for the credentials and copy into a new account and log the user in automatically


    let password = req.body.password;

    try {

    let user = await db.User.findOne(
      { where: { email: email } }
    );
      

    if(!user){
      throw {error:'Error logging in. Please check email and password and try again.'};
    }

    const lockouts = await db.sequelize.query(`SELECT * FROM bad_login_attempts
      WHERE user_id = '${user.user_id}' AND created_at BETWEEN (DATE_SUB(NOW(),INTERVAL 6 MINUTE)) AND NOW() ORDER BY created_at DESC LIMIT 3`, {
      model: db.BadLoginAttempt,
      mapToModel: true,
    });

    console.log('Lockouts found', lockouts);

    if(lockouts.length >= 3){
        console.log('Locked out of account');
        throw {error:LOGIN_ERROR_CODES.LOCKED_OUT}
    }

    const validate = await bcrypt.compare(password, user.password);

    //Password invalid so store bad login attempt
    if (!validate) {
        await db.BadLoginAttempt.create({user_id:user.user_id})
        throw {error:LOGIN_ERROR_CODES.PASSWORD_INVALID}
    }

    user['password']='';
    user.setDataValue('type', 'USER');


    //Password is valid so pass token to client
    const token = jwt.sign({ uid: user.user_id, type:'USER'},
    process.env.JWT_KEY,
    {
      algorithm: 'HS256',
      allowInsecureKeySizes: true,
      expiresIn: '72 hours', // 72 hours
    });

      res.status(200);
      res.send({'auth_token':token, user: user});

      }catch(e){

        console.log(e);
        res.status(500);
        res.send(e);

      }

  }else{

    console.log('Missing params');
    res.status(500);
    res.send({});
    
  }

};*/

exports.sendPasswordResetEmail = async (req, res) => {

  if(req.query.username && req.query.type){

    const username=req.query.username;

    try {

      if(req.query.type=='USER'){

      let user = await db.User.findOne(
        { where: { username: req.query.username } }
      );

      if(!user){
        throw 'There is no user for this username';
      }

    let code = utils.randomCode(6);

    await db.User.update(
      {
        verification_code:code
      },
      {where:{
        user_id:user.user_id
      }}
      );

      //send email
      let template = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml"
      xmlns:v="urn:schemas-microsoft-com:vml"
      xmlns:o="urn:schemas-microsoft-com:office:office">
      <head>
      <!--[if gte mso 9]><xml>
      <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
      </xml><![endif]-->
      <title>IIXI Conference</title>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0 " />
      <meta name="format-detection" content="telephone=no"/>
      <!--[if !mso]><!-->
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600&display=swap" rel="stylesheet">
      <!--<![endif]-->
      <style type="text/css">
        
      .primary-button{
        border-radius: 0.5rem;
        background-color:rgba(0, 42, 58, 1);	
      }
      body {
        margin: 0;
        padding: 0;
        -webkit-text-size-adjust: 100% !important;
        -ms-text-size-adjust: 100% !important;
        -webkit-font-smoothing: antialiased !important;
      }
      img {
        border: 0 !important;
        outline: none !important;
      }
      p {
        Margin: 0px !important;
        Padding: 0px !important;
      }
      table {
        border-collapse: collapse;
        mso-table-lspace: 0px;
        mso-table-rspace: 0px;
      }
      td, a, span {
        border-collapse: collapse;
        mso-line-height-rule: exactly;
      }
      .ExternalClass * {
        line-height: 100%;
      }
      .em_blue a {text-decoration:none; color:#264780;}
      .em_grey a {text-decoration:none; color:#434343;}
      .em_white a {text-decoration:none; color:#ffffff;}
      
      @media only screen and (min-width:481px) and (max-width:649px) {
      .em_main_table {width: 100% !important;}
      .em_wrapper{width: 100% !important;}
      .em_hide{display:none !important;}
      .em_aside10{padding:0px 10px !important;}
      .em_h20{height:20px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_h10{height:10px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_aside5{padding:0px 10px !important;}
      .em_ptop2 { padding-top:8px !important; }
      }
      @media only screen and (min-width:375px) and (max-width:480px) {
      .em_main_table {width: 100% !important;}
      .em_wrapper{width: 100% !important;}
      .em_hide{display:none !important;}
      .em_aside10{padding:0px 10px !important;}
      .em_aside5{padding:0px 8px !important;}
      .em_h20{height:20px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_h10{height:10px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_font_11 {font-size: 12px !important;}
      .em_font_22 {font-size: 22px !important; line-height:25px !important;}
      .em_w5 { width:7px !important; }
      .em_w150 { width:150px !important; height:auto !important; }
      .em_ptop2 { padding-top:8px !important; }
      u + .em_body .em_full_wrap { width:100% !important; width:100vw !important;}
      }
      @media only screen and (max-width:374px) {
      .em_main_table {width: 100% !important;}
      .em_wrapper{width: 100% !important;}
      .em_hide{display:none !important;}
      .em_aside10{padding:0px 10px !important;}
      .em_aside5{padding:0px 8px !important;}
      .em_h20{height:20px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_h10{height:10px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_font_11 {font-size: 11px !important;}
      .em_font_22 {font-size: 22px !important; line-height:25px !important;}
      .em_w5 { width:5px !important; }
      .em_w150 { width:150px !important; height:auto !important; }
      .em_ptop2 { padding-top:8px !important; }
      u + .em_body .em_full_wrap { width:100% !important; width:100vw !important;}
      }
      </style>
      
      </head>
      <body class="em_body" style="margin:0px auto; padding:0px;" bgcolor="#efefef">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" class="em_full_wrap" align="center"  bgcolor="#efefef">
          <tr>
            <td align="center" valign="top"><table align="center" width="650" border="0" cellspacing="0" cellpadding="0" class="em_main_table" style="width:650px; table-layout:fixed;">
                <tr>
                  <td align="left" valign="top" style="padding:0 25px;" class="em_aside10"><table width="100%" border="0" cellspacing="0" cellpadding="0" align="center">
                    <tr>
                      <td height="25" style="height:25px;" class="em_h20">&nbsp;</td>
                    </tr>
                    <tr>
                      <td align="left" valign="top" >
                        
                        <p style="font-family: Inter, sans-serif; font-size: 20px;font-weight:bold; line-height: 26px; color:#434343;">
                          IIXI Conference
                        </p>
                   
                      </td>
                    </tr>
                    <tr>
                      <td height="28" style="height:28px;" class="em_h20">&nbsp;</td>
                    </tr>
                  </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
      </table>
      <table width="100%" border="0" cellspacing="0" cellpadding="0" class="em_full_wrap" align="center" bgcolor="#efefef">
          <tr>
            <td align="center" valign="top" class="em_aside5"><table align="center" width="650" border="0" cellspacing="0" cellpadding="0" class="em_main_table" style="width:650px; table-layout:fixed;">
                <tr>
                  <td align="center" valign="top" style="padding:0 25px; background-color:#ffffff;" class="em_aside10"><table width="100%" border="0" cellspacing="0" cellpadding="0" align="center">
                    <tr>
                      <td height="45" style="height:45px;" class="em_h20">&nbsp;</td>
                    </tr>
                    <tr>
                      <td height="14" style="height:14px; font-size:0px; line-height:0px;">&nbsp;</td>
                    </tr>
                      <tr>
                      <td class="em_blue em_font_22" align="left" valign="top" style="font-family: Arial, sans-serif; font-size: 26px; line-height: 29px; color:#000807; font-weight:bold;">Reset your password here:</td>
                    </tr>
                    <tr>
                      <td height="14" style="height:14px; font-size:0px; line-height:0px;">&nbsp;</td>
                    </tr>
                    <tr>
                      <td class="em_grey" align="left" valign="top" style="font-family: Inter, sans-serif; font-size: 16px; line-height: 26px; color:#434343;"><b>
                      <a href="${process.env.FRONT_END_URL}reset-password?username=${username}&code=${code}&type=USER">${process.env.FRONT_END_URL}reset-password?username=${username}&code=${code}&type=USER</a> </td>
                    </tr>
                                     <tr>
                      <td height="26" style="height:26px;" class="em_h20">&nbsp;</td>
                    </tr>        
                      </table>
                      </td>
                    </tr>
                    <tr>
                      <td height="25" style="height:25px;" class="em_h20">&nbsp;</td>
                    </tr>
      
                    
                     <tr>
                      <td height="26" style="height:26px;" class="em_h20">&nbsp;</td>
                    </tr>
                    
                    <tr>
                      <td class="em_grey" align="left" valign="top" style="font-family: Inter, sans-serif; font-size: 16px; line-height: 26px; color:#434343;">Sincerely yours,
      
      <br class="em_hide" />
      </td>
                    </tr>
                    
                       <tr>
                      <td height="26" style="height:26px;" class="em_h20">&nbsp;</td>
                    </tr>
                    <tr>
                      <td class="em_grey" align="left" valign="top" style="font-family: Inter, sans-serif; font-size: 16px; line-height: 26px; color:#434343;">
      The IIXI Conference Team<br class="em_hide" />
      </td>
                    </tr>
                    
                    
                    <tr>
                      <td height="44" style="height:44px;" class="em_h20">&nbsp;</td>
                    </tr>
                  </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
      </table>
      <table width="100%" border="0" cellspacing="0" cellpadding="0" class="em_full_wrap" align="center" bgcolor="#efefef">
          <tr>
            <td align="center" valign="top"><table align="center" width="650" border="0" cellspacing="0" cellpadding="0" class="em_main_table" style="width:650px; table-layout:fixed;">
              
                 <tr>
                  <td align="center" valign="top" style="padding:0 25px;" class="em_aside10"><table width="100%" border="0" cellspacing="0" cellpadding="0" align="center">
                    <tr>
                      <td height="16" style="font-size:0px; line-height:0px; height:16px;">&nbsp;</td>
                    </tr>
                    <tr>
                      <td align="center" valign="top"><table border="0" cellspacing="0" cellpadding="0" align="left" class="em_wrapper">
                        <tr>
                          <td class="em_grey" align="center" valign="middle" style="font-family: Inter, sans-serif; font-size: 11px; line-height: 16px; color:#434343;">&copy; IIXI Conference  &nbsp;|&nbsp;  <a target="_blank" style="text-decoration:underline; color:#434343;">Unsubscribe</a></td>
                        </tr>
                      </table>
                      </td>
                    </tr>
                    <tr>
                      <td height="16" style="font-size:0px; line-height:0px; height:16px;">&nbsp;</td>
                    </tr>
                  </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
      </table>
      </body>
      </html>
      `
      utils.sendEmail(user.email, 'Forgot your password', template);

      res.status(200);
      res.send({});

    }else if(req.query.type=='VENDOR'){

      let user = await db.Vendor.findOne(
        { where: { username: req.query.username } }
      );

      if(!user){
        throw 'There is no user for this username';
      }

    let code = utils.randomCode(6);

    await db.Vendor.update(
      {
        verification_code:code
      },
      {where:{
        vendor_id:user.vendor_id
      }}
      );

      //send email
      let template = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml"
      xmlns:v="urn:schemas-microsoft-com:vml"
      xmlns:o="urn:schemas-microsoft-com:office:office">
      <head>
      <!--[if gte mso 9]><xml>
      <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
      </xml><![endif]-->
      <title>IIXI Conference</title>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0 " />
      <meta name="format-detection" content="telephone=no"/>
      <!--[if !mso]><!-->
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600&display=swap" rel="stylesheet">
      <!--<![endif]-->
      <style type="text/css">
        
      .primary-button{
        border-radius: 0.5rem;
        background-color:rgba(0, 42, 58, 1);	
      }
      body {
        margin: 0;
        padding: 0;
        -webkit-text-size-adjust: 100% !important;
        -ms-text-size-adjust: 100% !important;
        -webkit-font-smoothing: antialiased !important;
      }
      img {
        border: 0 !important;
        outline: none !important;
      }
      p {
        Margin: 0px !important;
        Padding: 0px !important;
      }
      table {
        border-collapse: collapse;
        mso-table-lspace: 0px;
        mso-table-rspace: 0px;
      }
      td, a, span {
        border-collapse: collapse;
        mso-line-height-rule: exactly;
      }
      .ExternalClass * {
        line-height: 100%;
      }
      .em_blue a {text-decoration:none; color:#264780;}
      .em_grey a {text-decoration:none; color:#434343;}
      .em_white a {text-decoration:none; color:#ffffff;}
      
      @media only screen and (min-width:481px) and (max-width:649px) {
      .em_main_table {width: 100% !important;}
      .em_wrapper{width: 100% !important;}
      .em_hide{display:none !important;}
      .em_aside10{padding:0px 10px !important;}
      .em_h20{height:20px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_h10{height:10px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_aside5{padding:0px 10px !important;}
      .em_ptop2 { padding-top:8px !important; }
      }
      @media only screen and (min-width:375px) and (max-width:480px) {
      .em_main_table {width: 100% !important;}
      .em_wrapper{width: 100% !important;}
      .em_hide{display:none !important;}
      .em_aside10{padding:0px 10px !important;}
      .em_aside5{padding:0px 8px !important;}
      .em_h20{height:20px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_h10{height:10px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_font_11 {font-size: 12px !important;}
      .em_font_22 {font-size: 22px !important; line-height:25px !important;}
      .em_w5 { width:7px !important; }
      .em_w150 { width:150px !important; height:auto !important; }
      .em_ptop2 { padding-top:8px !important; }
      u + .em_body .em_full_wrap { width:100% !important; width:100vw !important;}
      }
      @media only screen and (max-width:374px) {
      .em_main_table {width: 100% !important;}
      .em_wrapper{width: 100% !important;}
      .em_hide{display:none !important;}
      .em_aside10{padding:0px 10px !important;}
      .em_aside5{padding:0px 8px !important;}
      .em_h20{height:20px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_h10{height:10px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_font_11 {font-size: 11px !important;}
      .em_font_22 {font-size: 22px !important; line-height:25px !important;}
      .em_w5 { width:5px !important; }
      .em_w150 { width:150px !important; height:auto !important; }
      .em_ptop2 { padding-top:8px !important; }
      u + .em_body .em_full_wrap { width:100% !important; width:100vw !important;}
      }
      </style>
      
      </head>
      <body class="em_body" style="margin:0px auto; padding:0px;" bgcolor="#efefef">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" class="em_full_wrap" align="center"  bgcolor="#efefef">
          <tr>
            <td align="center" valign="top"><table align="center" width="650" border="0" cellspacing="0" cellpadding="0" class="em_main_table" style="width:650px; table-layout:fixed;">
                <tr>
                  <td align="left" valign="top" style="padding:0 25px;" class="em_aside10"><table width="100%" border="0" cellspacing="0" cellpadding="0" align="center">
                    <tr>
                      <td height="25" style="height:25px;" class="em_h20">&nbsp;</td>
                    </tr>
                    <tr>
                      <td align="left" valign="top" >
                        
                        <p style="font-family: Inter, sans-serif; font-size: 20px;font-weight:bold; line-height: 26px; color:#434343;">
                          IIXI Conference
                        </p>
                   
                      </td>
                    </tr>
                    <tr>
                      <td height="28" style="height:28px;" class="em_h20">&nbsp;</td>
                    </tr>
                  </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
      </table>
      <table width="100%" border="0" cellspacing="0" cellpadding="0" class="em_full_wrap" align="center" bgcolor="#efefef">
          <tr>
            <td align="center" valign="top" class="em_aside5"><table align="center" width="650" border="0" cellspacing="0" cellpadding="0" class="em_main_table" style="width:650px; table-layout:fixed;">
                <tr>
                  <td align="center" valign="top" style="padding:0 25px; background-color:#ffffff;" class="em_aside10"><table width="100%" border="0" cellspacing="0" cellpadding="0" align="center">
                    <tr>
                      <td height="45" style="height:45px;" class="em_h20">&nbsp;</td>
                    </tr>
                    <tr>
                      <td height="14" style="height:14px; font-size:0px; line-height:0px;">&nbsp;</td>
                    </tr>
                      <tr>
                      <td class="em_blue em_font_22" align="left" valign="top" style="font-family: Arial, sans-serif; font-size: 26px; line-height: 29px; color:#000807; font-weight:bold;">Reset your password here:</td>
                    </tr>
                    <tr>
                      <td height="14" style="height:14px; font-size:0px; line-height:0px;">&nbsp;</td>
                    </tr>
                    <tr>
                      <td class="em_grey" align="left" valign="top" style="font-family: Inter, sans-serif; font-size: 16px; line-height: 26px; color:#434343;"><b>
                      <a href="${process.env.FRONT_END_URL}reset-password?username=${username}&code=${code}&type=VENDOR">${process.env.FRONT_END_URL}reset-password?username=${username}&code=${code}&type=VENDOR</a> </td>
                    </tr>
                                     <tr>
                      <td height="26" style="height:26px;" class="em_h20">&nbsp;</td>
                    </tr>        
                      </table>
                      </td>
                    </tr>
                    <tr>
                      <td height="25" style="height:25px;" class="em_h20">&nbsp;</td>
                    </tr>
      
                    
                     <tr>
                      <td height="26" style="height:26px;" class="em_h20">&nbsp;</td>
                    </tr>
                    
                    <tr>
                      <td class="em_grey" align="left" valign="top" style="font-family: Inter, sans-serif; font-size: 16px; line-height: 26px; color:#434343;">Sincerely yours,
      
      <br class="em_hide" />
      </td>
                    </tr>
                    
                       <tr>
                      <td height="26" style="height:26px;" class="em_h20">&nbsp;</td>
                    </tr>
                    <tr>
                      <td class="em_grey" align="left" valign="top" style="font-family: Inter, sans-serif; font-size: 16px; line-height: 26px; color:#434343;">
      The IIXI Conference Team<br class="em_hide" />
      </td>
                    </tr>
                    
                    
                    <tr>
                      <td height="44" style="height:44px;" class="em_h20">&nbsp;</td>
                    </tr>
                  </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
      </table>
      <table width="100%" border="0" cellspacing="0" cellpadding="0" class="em_full_wrap" align="center" bgcolor="#efefef">
          <tr>
            <td align="center" valign="top"><table align="center" width="650" border="0" cellspacing="0" cellpadding="0" class="em_main_table" style="width:650px; table-layout:fixed;">
              
                 <tr>
                  <td align="center" valign="top" style="padding:0 25px;" class="em_aside10"><table width="100%" border="0" cellspacing="0" cellpadding="0" align="center">
                    <tr>
                      <td height="16" style="font-size:0px; line-height:0px; height:16px;">&nbsp;</td>
                    </tr>
                    <tr>
                      <td align="center" valign="top"><table border="0" cellspacing="0" cellpadding="0" align="left" class="em_wrapper">
                        <tr>
                          <td class="em_grey" align="center" valign="middle" style="font-family: Inter, sans-serif; font-size: 11px; line-height: 16px; color:#434343;">&copy; IIXI Conference  &nbsp;|&nbsp;  <a target="_blank" style="text-decoration:underline; color:#434343;">Unsubscribe</a></td>
                        </tr>
                      </table>
                      </td>
                    </tr>
                    <tr>
                      <td height="16" style="font-size:0px; line-height:0px; height:16px;">&nbsp;</td>
                    </tr>
                  </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
      </table>
      </body>
      </html>
      `
      utils.sendEmail(user.email, 'Forgot your password', template);
      res.status(200);
      res.send({});
     
    }else if(req.query.type=='SPONSOR'){ 

      let user = await db.Sponsor.findOne(
        { where: { username: req.query.username } }
      );

      if(!user){
        throw 'There is no user for this username';
      }

    let code = utils.randomCode(6);

    await db.Sponsor.update(
      {
        verification_code:code
      },
      {where:{
        sponsor_id:user.sponsor_id
      }}
      );

      //send email
      let template = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml"
      xmlns:v="urn:schemas-microsoft-com:vml"
      xmlns:o="urn:schemas-microsoft-com:office:office">
      <head>
      <!--[if gte mso 9]><xml>
      <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
      </xml><![endif]-->
      <title>IIXI Conference</title>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0 " />
      <meta name="format-detection" content="telephone=no"/>
      <!--[if !mso]><!-->
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600&display=swap" rel="stylesheet">
      <!--<![endif]-->
      <style type="text/css">
        
      .primary-button{
        border-radius: 0.5rem;
        background-color:rgba(0, 42, 58, 1);	
      }
      body {
        margin: 0;
        padding: 0;
        -webkit-text-size-adjust: 100% !important;
        -ms-text-size-adjust: 100% !important;
        -webkit-font-smoothing: antialiased !important;
      }
      img {
        border: 0 !important;
        outline: none !important;
      }
      p {
        Margin: 0px !important;
        Padding: 0px !important;
      }
      table {
        border-collapse: collapse;
        mso-table-lspace: 0px;
        mso-table-rspace: 0px;
      }
      td, a, span {
        border-collapse: collapse;
        mso-line-height-rule: exactly;
      }
      .ExternalClass * {
        line-height: 100%;
      }
      .em_blue a {text-decoration:none; color:#264780;}
      .em_grey a {text-decoration:none; color:#434343;}
      .em_white a {text-decoration:none; color:#ffffff;}
      
      @media only screen and (min-width:481px) and (max-width:649px) {
      .em_main_table {width: 100% !important;}
      .em_wrapper{width: 100% !important;}
      .em_hide{display:none !important;}
      .em_aside10{padding:0px 10px !important;}
      .em_h20{height:20px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_h10{height:10px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_aside5{padding:0px 10px !important;}
      .em_ptop2 { padding-top:8px !important; }
      }
      @media only screen and (min-width:375px) and (max-width:480px) {
      .em_main_table {width: 100% !important;}
      .em_wrapper{width: 100% !important;}
      .em_hide{display:none !important;}
      .em_aside10{padding:0px 10px !important;}
      .em_aside5{padding:0px 8px !important;}
      .em_h20{height:20px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_h10{height:10px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_font_11 {font-size: 12px !important;}
      .em_font_22 {font-size: 22px !important; line-height:25px !important;}
      .em_w5 { width:7px !important; }
      .em_w150 { width:150px !important; height:auto !important; }
      .em_ptop2 { padding-top:8px !important; }
      u + .em_body .em_full_wrap { width:100% !important; width:100vw !important;}
      }
      @media only screen and (max-width:374px) {
      .em_main_table {width: 100% !important;}
      .em_wrapper{width: 100% !important;}
      .em_hide{display:none !important;}
      .em_aside10{padding:0px 10px !important;}
      .em_aside5{padding:0px 8px !important;}
      .em_h20{height:20px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_h10{height:10px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_font_11 {font-size: 11px !important;}
      .em_font_22 {font-size: 22px !important; line-height:25px !important;}
      .em_w5 { width:5px !important; }
      .em_w150 { width:150px !important; height:auto !important; }
      .em_ptop2 { padding-top:8px !important; }
      u + .em_body .em_full_wrap { width:100% !important; width:100vw !important;}
      }
      </style>
      
      </head>
      <body class="em_body" style="margin:0px auto; padding:0px;" bgcolor="#efefef">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" class="em_full_wrap" align="center"  bgcolor="#efefef">
          <tr>
            <td align="center" valign="top"><table align="center" width="650" border="0" cellspacing="0" cellpadding="0" class="em_main_table" style="width:650px; table-layout:fixed;">
                <tr>
                  <td align="left" valign="top" style="padding:0 25px;" class="em_aside10"><table width="100%" border="0" cellspacing="0" cellpadding="0" align="center">
                    <tr>
                      <td height="25" style="height:25px;" class="em_h20">&nbsp;</td>
                    </tr>
                    <tr>
                      <td align="left" valign="top" >
                        
                        <p style="font-family: Inter, sans-serif; font-size: 20px;font-weight:bold; line-height: 26px; color:#434343;">
                          IIXI Conference
                        </p>
                   
                      </td>
                    </tr>
                    <tr>
                      <td height="28" style="height:28px;" class="em_h20">&nbsp;</td>
                    </tr>
                  </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
      </table>
      <table width="100%" border="0" cellspacing="0" cellpadding="0" class="em_full_wrap" align="center" bgcolor="#efefef">
          <tr>
            <td align="center" valign="top" class="em_aside5"><table align="center" width="650" border="0" cellspacing="0" cellpadding="0" class="em_main_table" style="width:650px; table-layout:fixed;">
                <tr>
                  <td align="center" valign="top" style="padding:0 25px; background-color:#ffffff;" class="em_aside10"><table width="100%" border="0" cellspacing="0" cellpadding="0" align="center">
                    <tr>
                      <td height="45" style="height:45px;" class="em_h20">&nbsp;</td>
                    </tr>
                    <tr>
                      <td height="14" style="height:14px; font-size:0px; line-height:0px;">&nbsp;</td>
                    </tr>
                      <tr>
                      <td class="em_blue em_font_22" align="left" valign="top" style="font-family: Arial, sans-serif; font-size: 26px; line-height: 29px; color:#000807; font-weight:bold;">Reset your password here:</td>
                    </tr>
                    <tr>
                      <td height="14" style="height:14px; font-size:0px; line-height:0px;">&nbsp;</td>
                    </tr>
                    <tr>
                      <td class="em_grey" align="left" valign="top" style="font-family: Inter, sans-serif; font-size: 16px; line-height: 26px; color:#434343;"><b>
                      <a href="${process.env.FRONT_END_URL}reset-password?username=${username}&code=${code}&type=VENDOR">${process.env.FRONT_END_URL}reset-password?username=${username}&code=${code}&type=VENDOR</a> </td>
                    </tr>
                                     <tr>
                      <td height="26" style="height:26px;" class="em_h20">&nbsp;</td>
                    </tr>        
                      </table>
                      </td>
                    </tr>
                    <tr>
                      <td height="25" style="height:25px;" class="em_h20">&nbsp;</td>
                    </tr>
      
                    
                     <tr>
                      <td height="26" style="height:26px;" class="em_h20">&nbsp;</td>
                    </tr>
                    
                    <tr>
                      <td class="em_grey" align="left" valign="top" style="font-family: Inter, sans-serif; font-size: 16px; line-height: 26px; color:#434343;">Sincerely yours,
      
      <br class="em_hide" />
      </td>
                    </tr>
                    
                       <tr>
                      <td height="26" style="height:26px;" class="em_h20">&nbsp;</td>
                    </tr>
                    <tr>
                      <td class="em_grey" align="left" valign="top" style="font-family: Inter, sans-serif; font-size: 16px; line-height: 26px; color:#434343;">
      The IIXI Conference Team<br class="em_hide" />
      </td>
                    </tr>
                    
                    
                    <tr>
                      <td height="44" style="height:44px;" class="em_h20">&nbsp;</td>
                    </tr>
                  </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
      </table>
      <table width="100%" border="0" cellspacing="0" cellpadding="0" class="em_full_wrap" align="center" bgcolor="#efefef">
          <tr>
            <td align="center" valign="top"><table align="center" width="650" border="0" cellspacing="0" cellpadding="0" class="em_main_table" style="width:650px; table-layout:fixed;">
              
                 <tr>
                  <td align="center" valign="top" style="padding:0 25px;" class="em_aside10"><table width="100%" border="0" cellspacing="0" cellpadding="0" align="center">
                    <tr>
                      <td height="16" style="font-size:0px; line-height:0px; height:16px;">&nbsp;</td>
                    </tr>
                    <tr>
                      <td align="center" valign="top"><table border="0" cellspacing="0" cellpadding="0" align="left" class="em_wrapper">
                        <tr>
                          <td class="em_grey" align="center" valign="middle" style="font-family: Inter, sans-serif; font-size: 11px; line-height: 16px; color:#434343;">&copy; IIXI Conference  &nbsp;|&nbsp;  <a target="_blank" style="text-decoration:underline; color:#434343;">Unsubscribe</a></td>
                        </tr>
                      </table>
                      </td>
                    </tr>
                    <tr>
                      <td height="16" style="font-size:0px; line-height:0px; height:16px;">&nbsp;</td>
                    </tr>
                  </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
      </table>
      </body>
      </html>
      `
      utils.sendEmail(user.email, 'Forgot your password', template);
      res.status(200);
      res.send({});

      
    }else{
      throw {};
    }

    
      }catch(e){

        console.log(e);
        res.status(200);
        res.send({});

      }

    }else{
        console.log('Missing params');
        res.status(500);
        res.send({});
      }

  
}

exports.updatePassword = async (req, res) => {

  if(req.body.old_password && req.body.new_password){

    let old_password = req.body.old_password;
    let new_password = req.body.new_password;

    try{

      if(req.userData.user_id){

        const validate = await bcrypt.compare(old_password, req.userData.password);

        if (!validate) {
          throw 'Error old password is invalid'
        }

        let passwordSchema = new passwordValidator();

        passwordSchema
        .is().min(8)                                    // Minimum length 8
        .is().max(100)                                  // Maximum length 100
        .has().uppercase()                              // Must have uppercase letters
        .has().lowercase()                              // Must have lowercase letters
        .has().digits(1)                                // Must have at least 2 digits
        .has().symbols(1)          // Must have at least 1 symbol
        .has().not().spaces()                           // Should not have spaces

        if(!passwordSchema.validate(new_password)){
          throw 'New password does not meet requirments';
        }
  
        let salt = bcrypt.genSaltSync(10);
        let hashed_password = bcrypt.hashSync(new_password, salt);

        await db.User.update(
          {
            password:hashed_password
          },
          {where:{
            user_id:req.userData.user_id
          }}
          );

          res.status(200);
          res.send({});


      }else if (req.userData.sponsor_id){

        const validate = await bcrypt.compare(old_password, req.userData.password);

        if (!validate) {
          throw 'Error old password is invalid'
        }

        let passwordSchema = new passwordValidator();

        passwordSchema
        .is().min(8)                                    // Minimum length 8
        .is().max(100)                                  // Maximum length 100
        .has().uppercase()                              // Must have uppercase letters
        .has().lowercase()                              // Must have lowercase letters
        .has().digits(1)                                // Must have at least 2 digits
        .has().symbols(1)          // Must have at least 1 symbol
        .has().not().spaces()                           // Should not have spaces

        if(!passwordSchema.validate(new_password)){
          throw 'New password does not meet requirments';
        }
  
        let salt = bcrypt.genSaltSync(10);
        let hashed_password = bcrypt.hashSync(new_password, salt);

        await db.Sponsor.update(
          {
            password:hashed_password
          },
          {where:{
            sponsor_id:req.userData.sponsor_id
          }}
          );

          res.status(200);
          res.send({});

      }else{
        throw {};
      }

    }catch(e){
    console.log(e);
    res.status(500);
    res.send(e);

    }

  }else{

    console.log('Missing params');
    res.status(500);
    res.send({});
    
  }

};

exports.updateAccountInfo = async (req, res) => {

    try{

          if(req.userData.user_id){

            let email = req.body.email;

            let conflictingEmail = await db.User.findOne({ where: { email: email, user_id: { [Op.not] : req.userData.user_id }} } );

            console.log(conflictingEmail);

            if(conflictingEmail){
              throw {error:REGISTER_ERROR_CODES.USERNAME_EXISTS};
            }

            await db.User.update(
              {
                email:email
              },
              {where:{
                user_id:req.userData.user_id
              }}
              );

              res.status(200);
              res.send({});


          }else if (req.userData.vendor_id){

            let email = req.body.email;

            let conflictingEmail = await db.Vendor.findOne({ where: { email: email, vendor_id: { [Op.not] : req.userData.vendor_id }} } );

            if(conflictingEmail){
              throw {error:REGISTER_ERROR_CODES.USERNAME_EXISTS};
            }

            await db.Vendor.update(
              {
                email:email
              },
              {where:{
                vendor_id:req.userData.vendor_id
              }}
              );

              res.status(200);
              res.send({});

          }else if (req.userData.sponsor_id){

            let email = req.body.email;

            let conflictingEmail = await db.Sponsor.findOne({ where: { email: email, sponsor_id: { [Op.not] : req.userData.sponsor_id }} } );

            if(conflictingEmail){
              throw {error:REGISTER_ERROR_CODES.USERNAME_EXISTS};
            }

            await db.Sponsor.update(
              {
                email:email
              },
              {where:{
                sponsor_id:req.userData.sponsor_id
              }}
              );

              res.status(200);
              res.send({});

          }else{
            throw {};
          }

  }catch(e){
    console.log(e);
    res.status(500);
    res.send(e);

  }



      
};

exports.forgotUserName = async (req, res) => {

  if(req.query.email && req.query.type){

    try {

    if(req.query.type=='USER'){

    let user = await db.User.findOne(
      { where: { email: req.query.email } }
    );

    if(user){

      let template = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml"
      xmlns:v="urn:schemas-microsoft-com:vml"
      xmlns:o="urn:schemas-microsoft-com:office:office">
      <head>
      <!--[if gte mso 9]><xml>
      <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
      </xml><![endif]-->
      <title>IIXI Conference</title>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0 " />
      <meta name="format-detection" content="telephone=no"/>
      <!--[if !mso]><!-->
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600&display=swap" rel="stylesheet">
      <!--<![endif]-->
      <style type="text/css">
        
      .primary-button{
        border-radius: 0.5rem;
        background-color:rgba(0, 42, 58, 1);	
      }
      body {
        margin: 0;
        padding: 0;
        -webkit-text-size-adjust: 100% !important;
        -ms-text-size-adjust: 100% !important;
        -webkit-font-smoothing: antialiased !important;
      }
      img {
        border: 0 !important;
        outline: none !important;
      }
      p {
        Margin: 0px !important;
        Padding: 0px !important;
      }
      table {
        border-collapse: collapse;
        mso-table-lspace: 0px;
        mso-table-rspace: 0px;
      }
      td, a, span {
        border-collapse: collapse;
        mso-line-height-rule: exactly;
      }
      .ExternalClass * {
        line-height: 100%;
      }
      .em_blue a {text-decoration:none; color:#264780;}
      .em_grey a {text-decoration:none; color:#434343;}
      .em_white a {text-decoration:none; color:#ffffff;}
      
      @media only screen and (min-width:481px) and (max-width:649px) {
      .em_main_table {width: 100% !important;}
      .em_wrapper{width: 100% !important;}
      .em_hide{display:none !important;}
      .em_aside10{padding:0px 10px !important;}
      .em_h20{height:20px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_h10{height:10px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_aside5{padding:0px 10px !important;}
      .em_ptop2 { padding-top:8px !important; }
      }
      @media only screen and (min-width:375px) and (max-width:480px) {
      .em_main_table {width: 100% !important;}
      .em_wrapper{width: 100% !important;}
      .em_hide{display:none !important;}
      .em_aside10{padding:0px 10px !important;}
      .em_aside5{padding:0px 8px !important;}
      .em_h20{height:20px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_h10{height:10px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_font_11 {font-size: 12px !important;}
      .em_font_22 {font-size: 22px !important; line-height:25px !important;}
      .em_w5 { width:7px !important; }
      .em_w150 { width:150px !important; height:auto !important; }
      .em_ptop2 { padding-top:8px !important; }
      u + .em_body .em_full_wrap { width:100% !important; width:100vw !important;}
      }
      @media only screen and (max-width:374px) {
      .em_main_table {width: 100% !important;}
      .em_wrapper{width: 100% !important;}
      .em_hide{display:none !important;}
      .em_aside10{padding:0px 10px !important;}
      .em_aside5{padding:0px 8px !important;}
      .em_h20{height:20px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_h10{height:10px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_font_11 {font-size: 11px !important;}
      .em_font_22 {font-size: 22px !important; line-height:25px !important;}
      .em_w5 { width:5px !important; }
      .em_w150 { width:150px !important; height:auto !important; }
      .em_ptop2 { padding-top:8px !important; }
      u + .em_body .em_full_wrap { width:100% !important; width:100vw !important;}
      }
      </style>
      
      </head>
      <body class="em_body" style="margin:0px auto; padding:0px;" bgcolor="#efefef">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" class="em_full_wrap" align="center"  bgcolor="#efefef">
          <tr>
            <td align="center" valign="top"><table align="center" width="650" border="0" cellspacing="0" cellpadding="0" class="em_main_table" style="width:650px; table-layout:fixed;">
                <tr>
                  <td align="left" valign="top" style="padding:0 25px;" class="em_aside10"><table width="100%" border="0" cellspacing="0" cellpadding="0" align="center">
                    <tr>
                      <td height="25" style="height:25px;" class="em_h20">&nbsp;</td>
                    </tr>
                    <tr>
                      <td align="left" valign="top" >
                        
                        <p style="font-family: Inter, sans-serif; font-size: 20px;font-weight:bold; line-height: 26px; color:#434343;">
                          IIXI Conference
                        </p>
                   
                      </td>
                    </tr>
                    <tr>
                      <td height="28" style="height:28px;" class="em_h20">&nbsp;</td>
                    </tr>
                  </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
      </table>
      <table width="100%" border="0" cellspacing="0" cellpadding="0" class="em_full_wrap" align="center" bgcolor="#efefef">
          <tr>
            <td align="center" valign="top" class="em_aside5"><table align="center" width="650" border="0" cellspacing="0" cellpadding="0" class="em_main_table" style="width:650px; table-layout:fixed;">
                <tr>
                  <td align="center" valign="top" style="padding:0 25px; background-color:#ffffff;" class="em_aside10"><table width="100%" border="0" cellspacing="0" cellpadding="0" align="center">
                    <tr>
                      <td height="45" style="height:45px;" class="em_h20">&nbsp;</td>
                    </tr>
                    <tr>
                      <td height="14" style="height:14px; font-size:0px; line-height:0px;">&nbsp;</td>
                    </tr>
                      <tr>
                      <td class="em_blue em_font_22" align="left" valign="top" style="font-family: Arial, sans-serif; font-size: 26px; line-height: 29px; color:#000807; font-weight:bold;">Your username is:</td>
                    </tr>
                    <tr>
                      <td height="14" style="height:14px; font-size:0px; line-height:0px;">&nbsp;</td>
                    </tr>
                    <tr>
                      <td class="em_grey" align="left" valign="top" style="font-family: Inter, sans-serif; font-size: 16px; line-height: 26px; color:#434343;"><b>${user.username} </td>
                    </tr>
                                     <tr>
                      <td height="26" style="height:26px;" class="em_h20">&nbsp;</td>
                    </tr>        
                      </table>
                      </td>
                    </tr>
                    <tr>
                      <td height="25" style="height:25px;" class="em_h20">&nbsp;</td>
                    </tr>
      
                    
                     <tr>
                      <td height="26" style="height:26px;" class="em_h20">&nbsp;</td>
                    </tr>
                    
                    <tr>
                      <td class="em_grey" align="left" valign="top" style="font-family: Inter, sans-serif; font-size: 16px; line-height: 26px; color:#434343;">Sincerely yours,
      
      <br class="em_hide" />
      </td>
                    </tr>
                    
                       <tr>
                      <td height="26" style="height:26px;" class="em_h20">&nbsp;</td>
                    </tr>
                    <tr>
                      <td class="em_grey" align="left" valign="top" style="font-family: Inter, sans-serif; font-size: 16px; line-height: 26px; color:#434343;">
      The IIXI Conference Team<br class="em_hide" />
      </td>
                    </tr>
                    
                    
                    <tr>
                      <td height="44" style="height:44px;" class="em_h20">&nbsp;</td>
                    </tr>
                  </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
      </table>
      <table width="100%" border="0" cellspacing="0" cellpadding="0" class="em_full_wrap" align="center" bgcolor="#efefef">
          <tr>
            <td align="center" valign="top"><table align="center" width="650" border="0" cellspacing="0" cellpadding="0" class="em_main_table" style="width:650px; table-layout:fixed;">
              
                 <tr>
                  <td align="center" valign="top" style="padding:0 25px;" class="em_aside10"><table width="100%" border="0" cellspacing="0" cellpadding="0" align="center">
                    <tr>
                      <td height="16" style="font-size:0px; line-height:0px; height:16px;">&nbsp;</td>
                    </tr>
                    <tr>
                      <td align="center" valign="top"><table border="0" cellspacing="0" cellpadding="0" align="left" class="em_wrapper">
                        <tr>
                          <td class="em_grey" align="center" valign="middle" style="font-family: Inter, sans-serif; font-size: 11px; line-height: 16px; color:#434343;">&copy; IIXI Conference  &nbsp;|&nbsp;  <a target="_blank" style="text-decoration:underline; color:#434343;">Unsubscribe</a></td>
                        </tr>
                      </table>
                      </td>
                    </tr>
                    <tr>
                      <td height="16" style="font-size:0px; line-height:0px; height:16px;">&nbsp;</td>
                    </tr>
                  </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
      </table>
      </body>
      </html>
      `
      utils.sendEmail(user.email, 'Forgot your username', template);

    }
    

    }else if(req.query.type=='VENDOR'){

    let user = await db.Vendor.findOne(
      { where: { email: req.query.email } }
    );

    if(user){

      let template = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml"
      xmlns:v="urn:schemas-microsoft-com:vml"
      xmlns:o="urn:schemas-microsoft-com:office:office">
      <head>
      <!--[if gte mso 9]><xml>
      <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
      </xml><![endif]-->
      <title>IIXI Conference</title>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0 " />
      <meta name="format-detection" content="telephone=no"/>
      <!--[if !mso]><!-->
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600&display=swap" rel="stylesheet">
      <!--<![endif]-->
      <style type="text/css">
        
      .primary-button{
        border-radius: 0.5rem;
        background-color:rgba(0, 42, 58, 1);	
      }
      body {
        margin: 0;
        padding: 0;
        -webkit-text-size-adjust: 100% !important;
        -ms-text-size-adjust: 100% !important;
        -webkit-font-smoothing: antialiased !important;
      }
      img {
        border: 0 !important;
        outline: none !important;
      }
      p {
        Margin: 0px !important;
        Padding: 0px !important;
      }
      table {
        border-collapse: collapse;
        mso-table-lspace: 0px;
        mso-table-rspace: 0px;
      }
      td, a, span {
        border-collapse: collapse;
        mso-line-height-rule: exactly;
      }
      .ExternalClass * {
        line-height: 100%;
      }
      .em_blue a {text-decoration:none; color:#264780;}
      .em_grey a {text-decoration:none; color:#434343;}
      .em_white a {text-decoration:none; color:#ffffff;}
      
      @media only screen and (min-width:481px) and (max-width:649px) {
      .em_main_table {width: 100% !important;}
      .em_wrapper{width: 100% !important;}
      .em_hide{display:none !important;}
      .em_aside10{padding:0px 10px !important;}
      .em_h20{height:20px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_h10{height:10px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_aside5{padding:0px 10px !important;}
      .em_ptop2 { padding-top:8px !important; }
      }
      @media only screen and (min-width:375px) and (max-width:480px) {
      .em_main_table {width: 100% !important;}
      .em_wrapper{width: 100% !important;}
      .em_hide{display:none !important;}
      .em_aside10{padding:0px 10px !important;}
      .em_aside5{padding:0px 8px !important;}
      .em_h20{height:20px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_h10{height:10px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_font_11 {font-size: 12px !important;}
      .em_font_22 {font-size: 22px !important; line-height:25px !important;}
      .em_w5 { width:7px !important; }
      .em_w150 { width:150px !important; height:auto !important; }
      .em_ptop2 { padding-top:8px !important; }
      u + .em_body .em_full_wrap { width:100% !important; width:100vw !important;}
      }
      @media only screen and (max-width:374px) {
      .em_main_table {width: 100% !important;}
      .em_wrapper{width: 100% !important;}
      .em_hide{display:none !important;}
      .em_aside10{padding:0px 10px !important;}
      .em_aside5{padding:0px 8px !important;}
      .em_h20{height:20px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_h10{height:10px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_font_11 {font-size: 11px !important;}
      .em_font_22 {font-size: 22px !important; line-height:25px !important;}
      .em_w5 { width:5px !important; }
      .em_w150 { width:150px !important; height:auto !important; }
      .em_ptop2 { padding-top:8px !important; }
      u + .em_body .em_full_wrap { width:100% !important; width:100vw !important;}
      }
      </style>
      
      </head>
      <body class="em_body" style="margin:0px auto; padding:0px;" bgcolor="#efefef">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" class="em_full_wrap" align="center"  bgcolor="#efefef">
          <tr>
            <td align="center" valign="top"><table align="center" width="650" border="0" cellspacing="0" cellpadding="0" class="em_main_table" style="width:650px; table-layout:fixed;">
                <tr>
                  <td align="left" valign="top" style="padding:0 25px;" class="em_aside10"><table width="100%" border="0" cellspacing="0" cellpadding="0" align="center">
                    <tr>
                      <td height="25" style="height:25px;" class="em_h20">&nbsp;</td>
                    </tr>
                    <tr>
                      <td align="left" valign="top" >
                        
                        <p style="font-family: Inter, sans-serif; font-size: 20px;font-weight:bold; line-height: 26px; color:#434343;">
                          IIXI Conference
                        </p>
                   
                      </td>
                    </tr>
                    <tr>
                      <td height="28" style="height:28px;" class="em_h20">&nbsp;</td>
                    </tr>
                  </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
      </table>
      <table width="100%" border="0" cellspacing="0" cellpadding="0" class="em_full_wrap" align="center" bgcolor="#efefef">
          <tr>
            <td align="center" valign="top" class="em_aside5"><table align="center" width="650" border="0" cellspacing="0" cellpadding="0" class="em_main_table" style="width:650px; table-layout:fixed;">
                <tr>
                  <td align="center" valign="top" style="padding:0 25px; background-color:#ffffff;" class="em_aside10"><table width="100%" border="0" cellspacing="0" cellpadding="0" align="center">
                    <tr>
                      <td height="45" style="height:45px;" class="em_h20">&nbsp;</td>
                    </tr>
                    <tr>
                      <td height="14" style="height:14px; font-size:0px; line-height:0px;">&nbsp;</td>
                    </tr>
                      <tr>
                      <td class="em_blue em_font_22" align="left" valign="top" style="font-family: Arial, sans-serif; font-size: 26px; line-height: 29px; color:#000807; font-weight:bold;">Your username is:</td>
                    </tr>
                    <tr>
                      <td height="14" style="height:14px; font-size:0px; line-height:0px;">&nbsp;</td>
                    </tr>
                    <tr>
                      <td class="em_grey" align="left" valign="top" style="font-family: Inter, sans-serif; font-size: 16px; line-height: 26px; color:#434343;"><b>${user.username} </td>
                    </tr>
                                     <tr>
                      <td height="26" style="height:26px;" class="em_h20">&nbsp;</td>
                    </tr>        
                      </table>
                      </td>
                    </tr>
                    <tr>
                      <td height="25" style="height:25px;" class="em_h20">&nbsp;</td>
                    </tr>
      
                    
                     <tr>
                      <td height="26" style="height:26px;" class="em_h20">&nbsp;</td>
                    </tr>
                    
                    <tr>
                      <td class="em_grey" align="left" valign="top" style="font-family: Inter, sans-serif; font-size: 16px; line-height: 26px; color:#434343;">Sincerely yours,
      
      <br class="em_hide" />
      </td>
                    </tr>
                    
                       <tr>
                      <td height="26" style="height:26px;" class="em_h20">&nbsp;</td>
                    </tr>
                    <tr>
                      <td class="em_grey" align="left" valign="top" style="font-family: Inter, sans-serif; font-size: 16px; line-height: 26px; color:#434343;">
      The IIXI Conference Team<br class="em_hide" />
      </td>
                    </tr>
                    
                    
                    <tr>
                      <td height="44" style="height:44px;" class="em_h20">&nbsp;</td>
                    </tr>
                  </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
      </table>
      <table width="100%" border="0" cellspacing="0" cellpadding="0" class="em_full_wrap" align="center" bgcolor="#efefef">
          <tr>
            <td align="center" valign="top"><table align="center" width="650" border="0" cellspacing="0" cellpadding="0" class="em_main_table" style="width:650px; table-layout:fixed;">
              
                 <tr>
                  <td align="center" valign="top" style="padding:0 25px;" class="em_aside10"><table width="100%" border="0" cellspacing="0" cellpadding="0" align="center">
                    <tr>
                      <td height="16" style="font-size:0px; line-height:0px; height:16px;">&nbsp;</td>
                    </tr>
                    <tr>
                      <td align="center" valign="top"><table border="0" cellspacing="0" cellpadding="0" align="left" class="em_wrapper">
                        <tr>
                          <td class="em_grey" align="center" valign="middle" style="font-family: Inter, sans-serif; font-size: 11px; line-height: 16px; color:#434343;">&copy; IIXI Conference  &nbsp;|&nbsp;  <a target="_blank" style="text-decoration:underline; color:#434343;">Unsubscribe</a></td>
                        </tr>
                      </table>
                      </td>
                    </tr>
                    <tr>
                      <td height="16" style="font-size:0px; line-height:0px; height:16px;">&nbsp;</td>
                    </tr>
                  </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
      </table>
      </body>
      </html>
      `
      utils.sendEmail(user.email, 'Forgot your username', template);

    }


    }else if(req.query.type=='SPONSOR'){

    let user = await db.Sponsor.findOne(
      { where: { email: req.query.email } }
    );

    if(user){

      let template = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml"
      xmlns:v="urn:schemas-microsoft-com:vml"
      xmlns:o="urn:schemas-microsoft-com:office:office">
      <head>
      <!--[if gte mso 9]><xml>
      <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
      </xml><![endif]-->
      <title>IIXI Conference</title>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0 " />
      <meta name="format-detection" content="telephone=no"/>
      <!--[if !mso]><!-->
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600&display=swap" rel="stylesheet">
      <!--<![endif]-->
      <style type="text/css">
        
      .primary-button{
        border-radius: 0.5rem;
        background-color:rgba(0, 42, 58, 1);	
      }
      body {
        margin: 0;
        padding: 0;
        -webkit-text-size-adjust: 100% !important;
        -ms-text-size-adjust: 100% !important;
        -webkit-font-smoothing: antialiased !important;
      }
      img {
        border: 0 !important;
        outline: none !important;
      }
      p {
        Margin: 0px !important;
        Padding: 0px !important;
      }
      table {
        border-collapse: collapse;
        mso-table-lspace: 0px;
        mso-table-rspace: 0px;
      }
      td, a, span {
        border-collapse: collapse;
        mso-line-height-rule: exactly;
      }
      .ExternalClass * {
        line-height: 100%;
      }
      .em_blue a {text-decoration:none; color:#264780;}
      .em_grey a {text-decoration:none; color:#434343;}
      .em_white a {text-decoration:none; color:#ffffff;}
      
      @media only screen and (min-width:481px) and (max-width:649px) {
      .em_main_table {width: 100% !important;}
      .em_wrapper{width: 100% !important;}
      .em_hide{display:none !important;}
      .em_aside10{padding:0px 10px !important;}
      .em_h20{height:20px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_h10{height:10px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_aside5{padding:0px 10px !important;}
      .em_ptop2 { padding-top:8px !important; }
      }
      @media only screen and (min-width:375px) and (max-width:480px) {
      .em_main_table {width: 100% !important;}
      .em_wrapper{width: 100% !important;}
      .em_hide{display:none !important;}
      .em_aside10{padding:0px 10px !important;}
      .em_aside5{padding:0px 8px !important;}
      .em_h20{height:20px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_h10{height:10px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_font_11 {font-size: 12px !important;}
      .em_font_22 {font-size: 22px !important; line-height:25px !important;}
      .em_w5 { width:7px !important; }
      .em_w150 { width:150px !important; height:auto !important; }
      .em_ptop2 { padding-top:8px !important; }
      u + .em_body .em_full_wrap { width:100% !important; width:100vw !important;}
      }
      @media only screen and (max-width:374px) {
      .em_main_table {width: 100% !important;}
      .em_wrapper{width: 100% !important;}
      .em_hide{display:none !important;}
      .em_aside10{padding:0px 10px !important;}
      .em_aside5{padding:0px 8px !important;}
      .em_h20{height:20px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_h10{height:10px !important; font-size: 1px!important; line-height: 1px!important;}
      .em_font_11 {font-size: 11px !important;}
      .em_font_22 {font-size: 22px !important; line-height:25px !important;}
      .em_w5 { width:5px !important; }
      .em_w150 { width:150px !important; height:auto !important; }
      .em_ptop2 { padding-top:8px !important; }
      u + .em_body .em_full_wrap { width:100% !important; width:100vw !important;}
      }
      </style>
      
      </head>
      <body class="em_body" style="margin:0px auto; padding:0px;" bgcolor="#efefef">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" class="em_full_wrap" align="center"  bgcolor="#efefef">
          <tr>
            <td align="center" valign="top"><table align="center" width="650" border="0" cellspacing="0" cellpadding="0" class="em_main_table" style="width:650px; table-layout:fixed;">
                <tr>
                  <td align="left" valign="top" style="padding:0 25px;" class="em_aside10"><table width="100%" border="0" cellspacing="0" cellpadding="0" align="center">
                    <tr>
                      <td height="25" style="height:25px;" class="em_h20">&nbsp;</td>
                    </tr>
                    <tr>
                      <td align="left" valign="top" >
                        
                        <p style="font-family: Inter, sans-serif; font-size: 20px;font-weight:bold; line-height: 26px; color:#434343;">
                          IIXI Conference
                        </p>
                   
                      </td>
                    </tr>
                    <tr>
                      <td height="28" style="height:28px;" class="em_h20">&nbsp;</td>
                    </tr>
                  </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
      </table>
      <table width="100%" border="0" cellspacing="0" cellpadding="0" class="em_full_wrap" align="center" bgcolor="#efefef">
          <tr>
            <td align="center" valign="top" class="em_aside5"><table align="center" width="650" border="0" cellspacing="0" cellpadding="0" class="em_main_table" style="width:650px; table-layout:fixed;">
                <tr>
                  <td align="center" valign="top" style="padding:0 25px; background-color:#ffffff;" class="em_aside10"><table width="100%" border="0" cellspacing="0" cellpadding="0" align="center">
                    <tr>
                      <td height="45" style="height:45px;" class="em_h20">&nbsp;</td>
                    </tr>
                    <tr>
                      <td height="14" style="height:14px; font-size:0px; line-height:0px;">&nbsp;</td>
                    </tr>
                      <tr>
                      <td class="em_blue em_font_22" align="left" valign="top" style="font-family: Arial, sans-serif; font-size: 26px; line-height: 29px; color:#000807; font-weight:bold;">Your username is:</td>
                    </tr>
                    <tr>
                      <td height="14" style="height:14px; font-size:0px; line-height:0px;">&nbsp;</td>
                    </tr>
                    <tr>
                      <td class="em_grey" align="left" valign="top" style="font-family: Inter, sans-serif; font-size: 16px; line-height: 26px; color:#434343;"><b>${user.username} </td>
                    </tr>
                                     <tr>
                      <td height="26" style="height:26px;" class="em_h20">&nbsp;</td>
                    </tr>        
                      </table>
                      </td>
                    </tr>
                    <tr>
                      <td height="25" style="height:25px;" class="em_h20">&nbsp;</td>
                    </tr>
      
                    
                     <tr>
                      <td height="26" style="height:26px;" class="em_h20">&nbsp;</td>
                    </tr>
                    
                    <tr>
                      <td class="em_grey" align="left" valign="top" style="font-family: Inter, sans-serif; font-size: 16px; line-height: 26px; color:#434343;">Sincerely yours,
      
      <br class="em_hide" />
      </td>
                    </tr>
                    
                       <tr>
                      <td height="26" style="height:26px;" class="em_h20">&nbsp;</td>
                    </tr>
                    <tr>
                      <td class="em_grey" align="left" valign="top" style="font-family: Inter, sans-serif; font-size: 16px; line-height: 26px; color:#434343;">
      The IIXI Conference Team<br class="em_hide" />
      </td>
                    </tr>
                    
                    
                    <tr>
                      <td height="44" style="height:44px;" class="em_h20">&nbsp;</td>
                    </tr>
                  </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
      </table>
      <table width="100%" border="0" cellspacing="0" cellpadding="0" class="em_full_wrap" align="center" bgcolor="#efefef">
          <tr>
            <td align="center" valign="top"><table align="center" width="650" border="0" cellspacing="0" cellpadding="0" class="em_main_table" style="width:650px; table-layout:fixed;">
              
                 <tr>
                  <td align="center" valign="top" style="padding:0 25px;" class="em_aside10"><table width="100%" border="0" cellspacing="0" cellpadding="0" align="center">
                    <tr>
                      <td height="16" style="font-size:0px; line-height:0px; height:16px;">&nbsp;</td>
                    </tr>
                    <tr>
                      <td align="center" valign="top"><table border="0" cellspacing="0" cellpadding="0" align="left" class="em_wrapper">
                        <tr>
                          <td class="em_grey" align="center" valign="middle" style="font-family: Inter, sans-serif; font-size: 11px; line-height: 16px; color:#434343;">&copy; IIXI Conference  &nbsp;|&nbsp;  <a target="_blank" style="text-decoration:underline; color:#434343;">Unsubscribe</a></td>
                        </tr>
                      </table>
                      </td>
                    </tr>
                    <tr>
                      <td height="16" style="font-size:0px; line-height:0px; height:16px;">&nbsp;</td>
                    </tr>
                  </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
      </table>
      </body>
      </html>
      `
      utils.sendEmail(user.email, 'Forgot your username', template);

    }

    }else{
      throw {};
    }

    
      res.status(200);
      res.send({});

      }catch(e){

        console.log(e);
        res.status(500);
        res.send(e);

      }

  }else{

    console.log('Missing params');
    res.status(500);
    res.send({});
    
  }

};

exports.getSecretQuestion = async (req, res) => {

  if(req.query.username && req.query.type){

    try {

      if(req.query.type=='USER'){

      let user = await db.User.findOne(
        { where: { username: req.query.username } }
      );

      res.status(200);
      res.send({secret_question:user.secret_question});

    }else if(req.query.type=='VENDOR'){

      let vendor = await db.Vendor.findOne(
        { where: { username: req.query.username } }
      );

      res.status(200);
      res.send({secret_question:vendor.secret_question});

    }else if(req.query.type=='SPONSOR'){ 

      let sponsor = await db.Sponsor.findOne(
        { where: { username: req.query.username } }
      );

      res.status(200);
      res.send({secret_question:sponsor.secret_question});
      
    }else{
      throw {};
    }

    
      }catch(e){

        console.log(e);
        res.status(500);
        res.send(e);

      }

  }else{

    console.log('Missing params');
    res.status(500);
    res.send({});
    
  }

};


exports.updatePasswordUnAuthed = async (req, res) => {

  console.log(req.body);

  if(req.body.username && req.body.newPassword && req.body.type && req.body.code){

  let username = req.body.username;
  let newPassword = req.body.newPassword;

  try{

    if(req.body.type=='USER'){

      let user = await db.User.findOne(
        { where: { username: username , verification_code:req.body.code} }
      );

      if(!user) throw 'There is no user for this username or code is invalid';

        let passwordSchema = new passwordValidator();

        passwordSchema
            .is().min(8)                                    // Minimum length 8
            .is().max(100)                                  // Maximum length 100
            .has().uppercase()                              // Must have uppercase letters
            .has().lowercase()                              // Must have lowercase letters
            .has().digits(1)                                // Must have at least 2 digits
            .has().symbols(1)          // Must have at least 1 symbol
            .has().not().spaces()                           // Should not have spaces

        if(!passwordSchema.validate(newPassword)){
              throw 'New password does not meet requirments';
        }

        let salt = bcrypt.genSaltSync(10);
        let hashed_password = bcrypt.hashSync(newPassword, salt);

        await db.User.update(
          {
            password:hashed_password
          },
          {where:{
            user_id:user.user_id
          }}
          );

    }else if(req.body.type=='VENDOR'){

      let vendor = await db.Vendor.findOne(
        { where: { username: username, verification_code:req.body.code } }
      );

      if(!vendor) throw 'There is no user for this username or code is invalid';

        let passwordSchema = new passwordValidator();

        passwordSchema
            .is().min(8)                                    // Minimum length 8
            .is().max(100)                                  // Maximum length 100
            .has().uppercase()                              // Must have uppercase letters
            .has().lowercase()                              // Must have lowercase letters
            .has().digits(1)                                // Must have at least 2 digits
            .has().symbols(1)          // Must have at least 1 symbol
            .has().not().spaces()                           // Should not have spaces

        if(!passwordSchema.validate(newPassword)){
              throw 'New password does not meet requirments';
        }

        let salt = bcrypt.genSaltSync(10);
        let hashed_password = bcrypt.hashSync(newPassword, salt);

        
        await db.Vendor.update(
          {
            password:hashed_password
          },
          {where:{
            vendor_id:vendor.vendor_id
          }}
          );
      
    }else if(req.body.type=='SPONSOR'){

      let sponsor = await db.Sponsor.findOne(
        { where: { username: username, verification_code:req.body.code} }
      );

      if(!sponsor) throw 'There is no user for this username or coce is invalid';

        let passwordSchema = new passwordValidator();

        passwordSchema
            .is().min(8)                                    // Minimum length 8
            .is().max(100)                                  // Maximum length 100
            .has().uppercase()                              // Must have uppercase letters
            .has().lowercase()                              // Must have lowercase letters
            .has().digits(1)                                // Must have at least 2 digits
            .has().symbols(1)          // Must have at least 1 symbol
            .has().not().spaces()                           // Should not have spaces

        if(!passwordSchema.validate(newPassword)){
              throw 'New password does not meet requirments';
        }

        let salt = bcrypt.genSaltSync(10);
        let hashed_password = bcrypt.hashSync(newPassword, salt);

        
        await db.Sponsor.update(
          {
            password:hashed_password
          },
          {where:{
            sponsor_id:sponsor.sponsor_id
          }}
          );

      }
   
    res.status(200);
    res.send({});

    }catch(e){
      console.log(e);
      newrelic.noticeError({text:'Error reseting password', error:e});
      res.status(500);
      res.send({});
    }

  }else{
    console.log('Missing params')
    res.status(500);
    res.send({});
  }

}


