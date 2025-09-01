const controller = require('./api.controller')

module.exports = function(app){

app.post('/api/create/challange',
        controller.createChallange);

app.get('/api/get/challanges',
                controller.getChallanges);
    
app.get('/api/get/challange',
    controller.getChallange);

app.get('/api/get/all-challanges',
        controller.getAllChallanges);

app.post('/api/create/problem',
        controller.createProblem);

app.get('/api/get/problems',
                controller.getProblems);

app.post('/api/create/team',
    controller.createTeam);

app.post('/api/edit/team',
        controller.editTeam);

app.post('/api/team/create-invite',
                controller.createInvite);        

app.post('/api/team/cancel-invite',
        controller.cancelInvite);

app.post('/api/team/respond-to-invite',
                controller.respondToInvite);

app.get('/api/get/all-students',
        controller.getAllStudents);

app.get('/api/get/my-teams',
            controller.getMyTeams);

app.get('/api/get/team',
                controller.getTeam);

app.post('/api/create/solution',
                    controller.createSolution);

app.post('/api/create/journey-video',
                        controller.createJourneyVideo);

app.get('/api/get/for-you-page',
    controller.getForYouPage);


app.post('/api/team/delete',
        controller.deleteTeam);

app.post('/api/jvi/delete',
                controller.deleteVideo);


app.post('/api/delete/account',
controller.deleteAccount);        

app.get('/api/get/user',
            controller.getUser);

app.get('/get-all-topics',
                controller.getAllTopics);
                        
}




