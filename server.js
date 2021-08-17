const http = require('http');
const app = require('./app');
const io = require('socket.io')(http);

const port = process.env.PORT || 80

const server = http.createServer(app);

io.on('connection', function(socket){
    console.log('a user connected');
});

// Listening server
server.listen(port, function(){
    console.log('Server started on port '+port+'...');
});