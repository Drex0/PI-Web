const express = require('express');
const app = express();
const morgan = require('morgan');
const path = require('path');
const fs = require('fs'); 
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const APP_PORT = process.env.PORT || 80;

const server = app.listen(APP_PORT, () => {
    console.log('App running on port %s', APP_PORT);
});

const io = require('socket.io').listen(server);

const rasbperrypiroutes = require('./api/routes/raspberrypi');   

// Directory path
//const directoryPath = "//sldat30/itshare/pishare/slideshow/inventory";
const directoryPath = "./inventory"

// Load view engine
app.set('views', path.join(__dirname,'views'));
app.set('view engine', 'pug');

// Setup morgan debug
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// mongoose setup
mongoose.connect('mongodb://localhost/MyDatabase');

const Schema = mongoose.Schema;
const UserDetail = new Schema({
    username: String,
    password: String
});
const UserDetails = mongoose.model('userInfo', UserDetail, 'userInfo');

// Passport
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, cb){
    cb(null, user.id);
});

passport.deserializeUser(function(id, cb){
    User.findById(id, function(err, user){
        cb(err, user);
    });
});

// passport local auth
passport.use(new LocalStrategy(
    function(username, password, done) {
        UserDetails.findOne({
            username: username
        }, function(err, user) {
            if(err){
                return done(err);
            }
            if(!user) {
                return done(null, false);
            }

            if(user.password != password) {
                return done(null, false);
            }
            return done(null, user);        
        });
    }
));

// CORS
app.use((req, res, next) =>{
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers", 
        "Origin, X-Requested-Width, Content-Type, Accept, Authorization"
    );
    if(req.method === 'OPTIONS'){
        res.header('Access-Control-Allow-Methods', 'POST, GET');
        return res.status(200).json({});
    }
    next();
});

// Set public folder and favicon
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(__dirname + '/public/img/favicon.ico'));

// Pi control routes 
app.use('/pis', rasbperrypiroutes);

app.post('/login', 
    passport.authenticate('local', { failureRedirect: '/login' }),
    function(req, res){
        res.redirect('/success?username='+req.user.username);
});

app.get('/login', function(req, res){
    res.render('login',{
        title:' Pi Control Login'
    });
});

app.get('/', function(req, res, next){
    // render the page
    res.render('index', {
        user: req.user,
        title:' Pi Control',
    });
});

// Error reporting
app.use((req, res, next) => {
    const error = new Error('Not found');
    error.status = 404;
    next(error);
});
app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    });
});

// make Promise version of fs.readdir()
fs.readdirAsync = function(directoryPath) {
    return new Promise(function(resolve, reject) {
        fs.readdir(directoryPath, function(err, filenames){
            if (err) 
                reject(err); 
            else 
                resolve(filenames);
        });
    });
};

// make Promise version of fs.readFile()
fs.readFileAsync = function(filename, enc) {
    return new Promise(function(resolve, reject) {
        fs.readFile(filename, enc, function(err, data){
            if (err) 
                reject(err); 
            else
                resolve(data);
        });
    });
};

// utility function, return Promise
function getFile(filename) {
    return fs.readFileAsync(directoryPath + '/' + filename, 'utf8');
}

// compare times to see if online / if within 90 seconds
function checkOnline(lastCheckIn){
    var online = false;
    var dLast = new Date(lastCheckIn);
    var today = new Date();    
    today.setMinutes(today.getMinutes()-2);

    // Check if PI reported back within 90 seconds
    if(dLast > today){
        online = true;
    }
    return online;
}

// Show connected and send pi info
io.on('connection', (socket) => {
    // Show connected
    console.log('a user connected');

    // read all files in the directory, and using Promise.all to time when all async readFiles has completed. 
    fs.readdirAsync(directoryPath).then(function (filenames){
        return Promise.all(filenames.map(getFile));
    }).then(function (files){
        var summaryPis = [];
        files.forEach(function(file) {
            // Start parsing IP, Mac, and Checkin
            // Ex. of what is in file:
            // ----- name ---------------------------------------
            // IP 10.10.10.10 ---- MAC 88:88:88:88:88:88
            // Last Checkin - Wed Sep 18 18:58:43 MDT 2019
            // Last Booted  - 2019-09-18 11:16:58
            
            var name = file.split(" ");
            var strName = name[1];
            var strIP = name[5];
            var strMAC = name[8].toUpperCase();
            var lC = file.lastIndexOf("Last Checkin");
            lastCheckIn = file.substr(lC+19, 24);
            var online = checkOnline(lastCheckIn);

            // Build PI object with name, ip, mac, last checkin date, and online status
            summaryPis.push({
                name: strName,
                ip: strIP,
                mac: strMAC,
                lastCheckIn: lastCheckIn,
                online: online
            });        
        });
        summaryPis.sort((a, b) => a.name.localeCompare(b.name)); 
        //console.log(summaryPis, null, 4);    

        // Send initial Pi info
        io.emit('piInfo', summaryPis);
        });

    // Send Pi info upon request
    socket.on('requestPiInfo', function(msg){
        //console.log('received...', msg);
        // read all files in the directory, and using Promise.all to time when all async readFiles has completed. 
        fs.readdirAsync(directoryPath).then(function (filenames){
            return Promise.all(filenames.map(getFile));
        }).then(function (files){
            var summaryPis = [];
            files.forEach(function(file) {
            // Start parsing IP, Mac, and Checkin
            // Ex. of what is in file:
            // ----- name ---------------------------------------
            // IP 10.10.10.10 ---- MAC 88:88:88:88:88:88
            // Last Checkin - Wed Sep 18 18:58:43 MDT 2019
            // Last Booted  - 2019-09-18 11:16:58
            
            var name = file.split(" ");
            var strName = name[1];
            var strIP = name[5];
            var strMAC = name[8].toUpperCase();
            var lC = file.lastIndexOf("Last Checkin");
            lastCheckIn = file.substr(lC+19, 24);
            var online = checkOnline(lastCheckIn);

            // Build PI object with name, ip, mac, last checkin date, and online status
            summaryPis.push({
                name: strName,
                ip: strIP,
                mac: strMAC,
                lastCheckIn: lastCheckIn,
                online: online
            });        
        });
        summaryPis.sort((a, b) => a.name.localeCompare(b.name)); 
        //console.log(summaryPis, null, 4);    

        // Send initial Pi info
        io.emit('piInfo', summaryPis);
        });

    });  
})

module.exports = app;