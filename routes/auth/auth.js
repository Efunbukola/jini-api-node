const controller = require('./auth.controller')

module.exports = function(app){


    app.post('/user/register',
    controller.registerUser);

    app.post('/auth/user',
    controller.loginUser);

    app.post('/api/user/edit',
        controller.editUser);

    app.post('/api/xapi/send',
        controller.sendXAPIStatement);

    app.get('/api/xapi/statements',
        controller.getXAPIStatement);
    
    app.get('/get-all-nurse-levels',
        controller.getAllNurseLevels);
  
    app.get('/get-all-countries',
        controller.getAllCountries);

    app.get('/get-all-clinical-skills',
        controller.getAllClinicalSkills);
        
    app.get('/get-all-languages',
        controller.getAllLanguages);

    app.get('/get-all-avatars',
        controller.getAllAvatars);
            
    app.get('/get-auth-data',
    controller.getAuthData);

    app.post('/api/update-password',
    controller.updatePassword);

    app.post('/update-password',
        controller.updatePasswordUnAuthed);
    
    app.post('/api/update-account',
    controller.updateAccountInfo);

    app.get('/auth/forgot-username',
        controller.forgotUserName);

    app.get('/get-secret-question',
            controller.getSecretQuestion);

    app.get('/send-password-reset',
                controller.sendPasswordResetEmail);
};
