const controller = require('./auth.controller')

module.exports = function(app){


    app.post('/user/register',
    controller.registerUser);

    app.post('/auth/user',
    controller.loginUser);

    app.post('/api/user/edit',
            controller.editUser);
    
    app.get('/get-all-skills',
                controller.getAllSkills);

    app.get('/get-all-industries',
                    controller.getAllIndustries);
    
    app.post('/api/vendor/edit',
            controller.editVendor);
    
    app.post('/api/sponsor/edit',
            controller.editSponsor);   
            
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
