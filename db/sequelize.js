require('dotenv').config({path : '../.env'});

const Sequelize = require("sequelize");

const sequelize = new Sequelize(process.env.MYSQL_DBNAME, process.env.MYSQL_USERNAME, process.env.MYSQL_PASSWORD,
{
  host: process.env.MYSQL_URL,
  dialect: process.env.DB_DIALECT,
  operatorsAliases: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

(async function (sequelize){
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
  })(sequelize)


const User = require('./models/user.js')(sequelize, Sequelize);
const UserLearningProfile = require('./models/user_learning_profile.js')(sequelize, Sequelize);
const JiniNursingLevel = require('./models/jini_nursing_level.js')(sequelize, Sequelize);
const JiniLanguage = require('./models/jini_language.js')(sequelize, Sequelize);
const JiniCountry = require('./models/jini_country.js')(sequelize, Sequelize);
const JiniClinicalSkill = require('./models/jini_clinical_skill.js')(sequelize, Sequelize);
const JiniAvatar = require('./models/jini_avatar.js')(sequelize, Sequelize);
const BadLoginAttempt = require('./models/bad_login_attempt.js')(sequelize, Sequelize);

User.hasOne(UserLearningProfile,  {foreignKey: 'fk_user_id'})


/*
JiniAvatar.hasOne(UserLearningProfile)
JiniLanguage.hasOne(JiniLanguage)
UserLearningProfile.hasOne(JiniClinicalSkill)
UserLearningProfile.hasOne(JiniNursingLevel)
*/


/*
Team.hasMany(TeamMembership, {
  foreignKey: "fk_team_id",
});

Team.hasMany(TeamInvite, {
  foreignKey: "fk_team_id",
});

User.hasMany(TeamInvite, {
  foreignKey: "fk_user_id",
});


JourneyVideo.hasMany(JvTopicAssociation, {
  foreignKey: "fk_journey_video_id",
});
*/


//Skill.belongsTo(User, {through: 'user_skill_association'});


module.exports = {
    User,
    UserLearningProfile,
    JiniAvatar,
    JiniClinicalSkill,
    JiniLanguage,
    JiniNursingLevel,
    JiniCountry,
    sequelize,
    Sequelize
};