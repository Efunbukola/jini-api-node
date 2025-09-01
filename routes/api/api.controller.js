const utils = require("../../services/utils");
let mysql = require('mysql2');
const passwordValidator = require('password-validator');
const  bcrypt = require('bcryptjs');
const db = require('../../db/sequelize.js');
const puppeteer = require("puppeteer");
const cheerio = require ("cheerio");
const axios = require("axios").default;
const { Op } = require('sequelize');


const ROLES = {
    STUDENT:1,
    INDUSTRY:2
 }


exports.createChallange = async (req, res) => { 

    console.log(req.body)

    if(
      req.body.duration
      && req.body.bounty_amount
      && req.body.bounty_total_pay
      && req.body.pay_rules
      && req.body.problem_statement
      && req.body.penalty_description
      && req.body.purpose
      && req.body.eligibility
      && req.body.description
      && req.body.instructions
      && req.body.deliverables
      && req.userData.sponsor_id
      ){
  
        try {
  
        let newChallange = await db.Challange.create({
          sponsor_id: req.userData.sponsor_id,
          duration: req.body.duration, 
          bounty_amount: req.body.bounty_amount,
          bounty_total_pay: req.body.bounty_total_pay,
          pay_rules:req.body.pay_rules,
          problem_statement: req.body.problem_statement,
          logo_url:req.body.logo_url,
          ad_url:req.body.ad_url,
          penalty_description: req.body.penalty_description,
          purpose : req.body.purpose,
          eligibility : req.body.eligibility,
          description : req.body.description,
          instructions : req.body.instructions,
          deliverables : req.body.deliverables
        });
  
        res.status(200);
        res.send(newChallange);
  
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

exports.getChallanges = async (req, res) => {
  
    if(req.userData.sponsor_id
      ){
  
        try {
  
        let challanges = await db.Challange.findAll({
          where: {
            sponsor_id: req.userData.sponsor_id
          },
          include:  { all: true }
        });
  
        res.status(200);
        res.send(challanges);
  
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

exports.getChallange = async (req, res) => {
  
    if(req.query.challange_id
      ){
  
        try {

        let challange = await db.Challange.findOne({
          where: {
            challange_id: req.query.challange_id
          },
          include:  { all: true }
        });

        if(challange){
            res.status(200);
            res.send(challange);
        }else{
            res.status(500);
            res.send();
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

exports.getAllChallanges = async (req, res) => {

        try {
  
        let challanges = await db.Challange.findAll({
          include:  { all: true }
        });
  
        res.status(200);
        res.send(challanges);
  
        }catch(e){
          console.log(e);
          res.status(500);
          res.send(e);
        }

};

exports.createProblem = async (req, res) => { 

    if(
      req.body.challange_id
      && req.body.video_url
      && req.body.severity
      && req.body.additional_info
      && req.body.frequency
      && req.userData.user_id
      ){
  
        try {
  
        let newProblem = await db.Problem.create({
            user_id: req.userData.user_id,
            additional_info: req.body.additional_info,
            challange_id: req.body.challange_id, 
            frequency: req.body.frequency,
            severity: req.body.severity,
            video_url:req.body.video_url
        });
  
        res.status(200);
        res.send(newProblem);
  
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

exports.getProblems = async (req, res) => {
  
    if(req.userData.user_id
      ){
  
        try {
  
        let problems = await db.Problem.findAll({
          where: {
            user_id: req.userData.user_id
          },
          include:  { all: true }
        });
  
        res.status(200);
        res.send(problems);
  
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

exports.createTeam = async (req, res) => {

    console.log(req.body)

    if(
      req.body.team_name
      && req.userData.user_id
      && req.body.users
      ){
  
        try {
  
        let newTeam = await db.Team.create({
            owner_id: req.userData.user_id,
            team_name: req.body.team_name
        });

          for(user of req.body.users){
      
            await db.TeamInvite.create({
             team_id:newTeam.team_id,
             user_id: user.user_id,
             team_owner_id:req.userData.user_id,
             email: user.email
            });
            
      
          }
  
        res.status(200);
        res.send(newTeam);
  
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

exports.createInvite = async (req, res) => { 

  if(
    req.body.user_id
    && req.body.team_id
    && req.body.email
    && req.userData.user_id
    ){

      try {

      let team = await db.Team.findOne(
        { where: { team_id: req.body.team_id }
      });

      await db.TeamInvite.create({
          user_id: req.body.user_id,
          team_id: req.body.team_id,
          email: req.body.email, 
          team_name: team.team_name,
          team_owner_id: req.userData.user_id
      });

      res.status(200);
      res.send();

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



exports.cancelInvite = async (req, res) => { 

  if(req.body.team_invite_id && req.userData.user_id){
  
      try {

          await db.TeamInvite.destroy({
              where: {
                pk_team_invite_id: req.body.team_invite_id,
                team_owner_id: req.userData.user_id
              }
            });

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

exports.respondToInvite = async (req, res) => { 

  if(req.body.team_id && req.body.team_invite_id && req.body.accepted && req.userData.user_id){
  
      try {

        if(req.body.accepted){

          await db.TeamMembership.create({
            team_id:req.body.team_id,
            user_id: req.userData.user_id,
           });

           await db.TeamInvite.destroy({
            where: {
              pk_team_invite_id: req.body.team_invite_id,
              fk_user_id: req.userData.user_id
            }
          });

        }else{

          await db.TeamInvite.destroy({
            where: {
              pk_team_invite_id: req.body.team_invite_id,
              fk_user_id: req.userData.user_id
            }
          });

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

exports.editTeam = async (req, res) => { 

    console.log(req.body)
    if(
      req.body.team_id
      && req.body.team_name
      && req.userData.user_id
      && req.body.users
      ){
  
        try {
  
        await db.Team.update(
        {
            team_name: req.body.team_name
        },
        { where:{
            owner_id:req.userData.user_id,
            team_id:req.body.team_id
            }
        });

        await db.TeamMembership.destroy({
            where: {
              team_id: req.body.team_id,
            },
        });

        for(user of req.body.users){
      
            await db.TeamMembership.create({
             team_id:req.body.team_id,
             user_id: user.user_id,
            });
            
      
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

exports.getMyTeams = async (req, res) => {
  
    if(req.userData.user_id
      ){
  
        try {
  
        //let member_teams = await db.sequelize.query(`SELECT * FROM team_membership WHERE fk_user_id = '${req.userData.user_id} INNER JOIN user ON user.user_id = team_membership.fk_user_id`);

        //Teams the user is a member of

        let memberships = await db.TeamMembership.findAll({
          where: {
            user_id: req.userData.user_id
          },
          include:  { all: true }
        });

        let member_teams = [];

        for(const membership of memberships){

            let team = await db.Team.findOne({
                where: {
                  team_id: membership.team_id
                },
                include:  { all: true }
            });

           
            if(team){      
                
                let users = [];

                for(const mem of team.team_memberships){
                
                    let user = await db.User.findOne({
                        where: {
                          user_id: mem.user_id
                        }
                    });

                    users.push(user);

                }

                
                member_teams.push({...team.dataValues, members:users})
            }

        }
        
        //teams the user owns
        let teams = await db.Team.findAll({
            where: {
              owner_id: req.userData.user_id
            },
            include:  { all: true }
          });
  
        res.status(200);
        res.send({member_teams, teams});
  
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

exports.getTeam = async (req, res) => {
  
    if(req.userData.user_id
        && req.query.team_id
      ){
  
        try {

        let team = await db.Team.findOne({
          where: {
            team_id: req.query.team_id
          },
          include:  { all: true }
        });

        let members = [];

        console.log(team);

        if(team){

            for(const membership of team.team_memberships){

                let user = await db.User.findOne({
                    where: {
                      user_id: membership.user_id
                    },
                    include:  { all: true }
                  });

                  members.push(user);

            }

        }

        let videos = [];

        let owner = await db.User.findOne({
          where: {
            user_id: team.owner_id
          },
          include:  { all: true }
        });

        owner.journey_videos.forEach(v=>videos.push({video:v, user:owner}))

        for(const user of members){
          user.journey_videos.forEach(v=>videos.push({video:v, user:user}))
        }


        if(team){
            res.status(200);
            res.send({team, members, videos});
        }else{
            res.status(500);
            res.send();
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

exports.getAllStudents = async (req, res) => {

    try {

    let students = await db.User.findAll({
     where: {
        role_id: ROLES.STUDENT
     },
      include:  { all: true }
    });

    res.status(200);
    res.send(students);

    }catch(e){
      console.log(e);
      res.status(500);
      res.send(e);
    }

};

exports.createSolution = async (req, res) => { 

    if(
      req.userData.user_id
      ){
  
        try {
  
        let newSolution = await db.Solution.create({
            user_id: req.userData.user_id,
            git_url: req.body.git_url, 
            additional_info: req.body.additional_info, 
            challange_id:req.body.challange_id,
            google_drive_url: req.body.google_drive_url,
            video_url: req.body.video_url
        });
  
        res.status(200);
        res.send(newSolution);
  
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

exports.getAllTopics = async (req, res) => {

    let topics = await db.JvTopic.findAll();
    res.status(200);
    res.send(topics);

};

exports.createJourneyVideo = async (req, res) => {

    if(
      req.body.video_url
      && req.body.privacy
      && req.body.status
      && req.userData.user_id
      ){
  
        try {
  
        let newJV = await db.JourneyVideo.create({
            user_id: req.userData.user_id,
            privacy: req.body.privacy,
            status:req.body.status,
            keywords: req.body.keywords,
            video_url:req.body.video_url
        });

        for(let topic of req.body.jv_topic_list){

          console.log(topic)

          console.log({
            journey_video_id: newJV.journey_video_id,
            fk_jv_topic_id: topic.jv_topic_id,
          })
        
          await db.JvTopicAssociation.create({
            journey_video_id: newJV.journey_video_id,
            jv_topic_id: topic.jv_topic_id,
          });

        }
              
  
        res.status(200);
        res.send(newJV);
  
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

exports.getForYouPage = async (req, res) => { 
  
    if(req.userData.user_id
      ){
  
        try {

        let public_videos = await db.JourneyVideo.findAll({
            where: {
                privacy: 'PUBLIC'
            },
            include:  { all: true }
          });
  
        let users_who_are_visible = [];

        //all the teams a user is apart of
        let memberships = await db.TeamMembership.findAll({
          where: {
            user_id: req.userData.user_id
          },
          include:  { all: true }
        });

        //all the members of those teams
        for(const membership of memberships){

            let team_members = await db.TeamMembership.findAll({
                where: {
                  team_id: membership.team_id
                },
                include:  { all: true }
            });

            team_members.map(tm=>tm.user_id).forEach(tm=>users_who_are_visible.push(tm))

        }
        
        //teams the user owns
        let teams = await db.Team.findAll({
            where: {
              owner_id: req.userData.user_id
            },
            include:  { all: true }
        });

        for(const team of teams){

            let team_members = await db.TeamMembership.findAll({
                where: {
                  team_id: team.team_id
                },
                include:  { all: true }
            });

            team_members.map(tm=>tm.user_id).forEach(tm=>users_who_are_visible.push(tm))

        }

        users_who_are_visible = users_who_are_visible.filter( ( item, index, inputArray ) => {
            return inputArray.indexOf(item) == index;
        })

        let private_videos = await db.JourneyVideo.findAll({
            where: {
                privacy: 'PRIVATE',
                user_id: {
                    [Op.or]: users_who_are_visible,
                  },
            },
            include:  { all: true, nested: true }
          });
        
        console.log(private_videos)  
        
        let vs = public_videos.concat(private_videos).sort(
            (x, y)=>{
                date1 = new Date(x.created_at);
                date2 = new Date(y.created_at);
            return date2 - date1 ;
        })
        

        let fyp_videos = [];


        for(fypv of vs){

            let user = await db.User.findAll({
                where: {
                  user_id: fypv.user_id
                },
                include:  { all: true }
            });

            fyp_videos.push({...fypv.dataValues, user:user[0]})

        }

        let selected_fyp_videos = [];
        
        for(fypv of fyp_videos){

          isSelected=false;

          for(assoc of fypv.jv_associations){

            let topic = await db.JvTopic.findOne({
              where: {
                jv_topic_id: assoc.jv_topic_id
              }
            });

            console.log('Found topic', topic)
            console.log('Comparing with ', req.userData.user_profile.stem_interests)

            if(req.userData.user_profile.stem_interests){

              if(req.userData.user_profile.stem_interests.toLowerCase().includes(topic.jv_topic_name.toLowerCase())){
                console.log('Was selected')
                isSelected=true;
              }

            }

          }

          if(isSelected){
            selected_fyp_videos.push(fypv)
          }

        }

        


        
        
        res.status(200);
        res.send(selected_fyp_videos);
  
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

exports.deleteTeam = async (req, res) => {

    if(req.body.team_id && req.userData.user_id){
  
      let team_id = req.body.team_id;
  
        try {
  
            await db.Team.destroy({
                where: {
                    team_id: team_id,
                    owner_id: req.userData.user_id
                }
              });

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

exports.deleteVideo = async (req, res) => {

  if(req.body.video_id && req.userData.user_id){

      try {

          await db.JourneyVideo.destroy({
              where: {
                journey_video_id: req.body.video_id,
                user_id: req.userData.user_id
              }
            });

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

exports.getUser = async (req, res) => {
  
    if(req.query.user_id
      ){
  
        try {

        let user = await db.User.findOne({
          where: {
            user_id: req.query.user_id
          },
          include:  { all: true }
        });

        if(user){
            res.status(200);
            res.send(user);
        }else{
            res.status(500);
            res.send();
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

exports.deleteAccount = async (req, res) => {

  if(req.userData.user_id){

      try {

        let user = await db.User.findOne({
          where: {
              user_id: req.userData.user_id
          }
        });

        await db.ArchivedUser.create({archived_user_id:user.user_id, email:user.email, password:user.password, role_id:user.role_id})

        await db.User.destroy({
              where: {
                  user_id: req.userData.user_id
              }
        });

        await db.TeamMembership.destroy({
            where: {
              user_id: req.userData.user_id,
            },
        });

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
  
