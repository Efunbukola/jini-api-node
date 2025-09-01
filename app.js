const express  = require('express');
const morgan = require('morgan');             // log requests to the console (express4)
const bodyParser = require('body-parser');    // pull information from HTML POST (express4)
const methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
const cors = require('cors')
const { verifyAuth } = require('./services/utils.js');

require('dotenv').config();

const app = express();

app.use(morgan('dev'));                                         // log every request to the console
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride()); 

const corsOptions = {
    origin: [
    'https://localhost',
    'http://localhost:8100',
    'http://hbcu-ip-ui.s3-website-us-east-1.amazonaws.com',
    'https://juiceip.juicenetwork.org',
    'https://www.juiceip.juicenetwork.org',
    'juiceip.juicenetwork.org',
    'www.juiceip.juicenetwork.org'],
    optionsSuccessStatus: 200,
    methods:['GET', 'POST']
}

app.use(cors(corsOptions));
app.use('/api/*', verifyAuth);
app.use('/get-auth-data', verifyAuth);

let server = app.listen(process.env.PORT || process.env.SERVER_PORT, function () {
    let port = server.address().port;
    console.log("APP RUNNING ON PORT", port);
});

app.get('/', (req, res) => {
    res.status(200);
    res.send("Server is running");
});


//require('./routes/api/api.js')(app);
require('./routes/auth/auth.js')(app);

const newrelic = require('newrelic')
newrelic.noticeError('Restarting server...');


