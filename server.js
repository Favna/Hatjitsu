
/**
 * Module dependencies.
 */
var _ = require('underscore')._;

var env = process.env.NODE_ENV || 'development';

var express = require('express'),
    fs = require('fs'),
    http = require('http');

var bodyParser = require('body-parser');
var methodOverride = require('method-override');

var app = module.exports = express();
var lobbyClass = require('./lib/lobby.js');
var config = require('./config.js')[env];
var path = require('path');
var server = http.createServer(app);
var io = require('socket.io').listen(server);

var lobby = new lobbyClass.Lobby(io);

var statsConnectionCount = 0;
var statsDisconnectCount = 0;
var statsSocketCount = 0;
var statsSocketMessagesReceived = 0;

// Configuration

app.set('views', __dirname + '/app');
app.set('view engine', 'ejs');
app.set('view options', {
    layout: false
});

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

// app.use(express.logger());
// app.use(express.methodOverride());
app.use(methodOverride('X-HTTP-Method-Override'))
// app.use(express.staticCache());

// app.use(assetsManagerMiddleware);
app.use(express.static(path.join(__dirname + '/app')))
// app.use(express.errorHandler());

app.get('/', function(req, res) {
  res.render('index.ejs');
});

app.get('/debug_state', function(req, res) {
  res.json({
    "stats": {
      "connectionCount": statsConnectionCount,
      "disconnectCount": statsDisconnectCount,
      "currentSocketCount": statsSocketCount,
      "socketMessagesReceived": statsSocketMessagesReceived
    },
    "rooms": _.map(lobby.rooms, function(room, key) { return room.json() } )
  });
});

app.get('/styleguide', function(req, res) {
  res.render('styleguide.ejs');
});

app.get('/:id', function(req, res) {
  if (req.params.id in lobby.rooms) {
    res.render('index.ejs');
  } else {
   res.redirect('/');  
  }
});


io.configure(function () {
  io.set('transports', ['websocket', 'htmlfile', 'xhr-polling', 'jsonp-polling']);
});

io.configure('production', function(){
  io.enable('browser client minification');
  io.enable('browser client etag');
  io.enable('browser client gzip');
  io.set("polling duration", 10);
  io.set('log level', 1);
});
io.configure('development', function(){
  io.set('log level', 2);
});

var port = process.env.app_port || 5608; // Use the port that Heroku provides or default to 5608
server.listen(port, function() {
  console.log(`Express server listening on port ${port}`);
});




/* EVENT LISTENERS */

io.sockets.on('connection', function (socket) {

  statsConnectionCount++;
  statsSocketCount++;

  socket.on('disconnect', function () {
    statsDisconnectCount++;
    statsSocketCount--;
    lobby.broadcastDisconnect(socket);
  });
  
  socket.on('create room', function (data, callback) {
    statsSocketMessagesReceived++;
    callback(lobby.createRoom());
  });

  socket.on('join room', function (data, callback) {
    statsSocketMessagesReceived++;
    var room = lobby.joinRoom(socket, data);
    if(room.error) {
      callback( { error: room.error } );
    } else {
      callback(room.info());
    }
  });

  socket.on('room info', function (data, callback) {
    statsSocketMessagesReceived++;
    var room = lobby.getRoom(data.roomUrl);
    if (room.error) {
      callback( { error: room.error } );
    } else {
      callback(room.info());
    }
  });

  socket.on('set card pack', function (data, cardPack) {
    statsSocketMessagesReceived++;
    var room = lobby.getRoom(data.roomUrl);
    if (!room.error) {
      room.setCardPack(data);
    }
  });

  socket.on('vote', function (data, callback) {
    statsSocketMessagesReceived++;
    var room = lobby.getRoom(data.roomUrl);
    if (room.error) {
      callback( { error: room.error });
    } else {
      room.recordVote(socket, data);
      callback( {} );
    }
  });

  socket.on('unvote', function (data, callback) {
    statsSocketMessagesReceived++;
    var room = lobby.getRoom(data.roomUrl);
    if (room.error) {
      callback( { error: room.error });
    } else {
      room.destroyVote(socket, data);
      callback( {} );
    }
  });

  socket.on('reset vote', function (data, callback) {
    statsSocketMessagesReceived++;
    var room = lobby.getRoom(data.roomUrl);
    if (room.error) {
      callback( { error: room.error });
    } else {
      room.resetVote();
      callback( {} );
    }
  });

  socket.on('force reveal', function (data, callback) {
    statsSocketMessagesReceived++;
    var room = lobby.getRoom(data.roomUrl);
    if (room.error) {
      callback( { error: room.error });
    } else {
      room.forceReveal();
      callback( {} );
    }
  });

  socket.on('sort votes', function (data, callback) {
    statsSocketMessagesReceived++;
    var room = lobby.getRoom(data.roomUrl);
    if (room.error) {
      callback( { error: room.error });
    } else {
      room.sortVotes();
      callback( {} );
    }
  });

  socket.on('toggle voter', function (data, callback) {
    statsSocketMessagesReceived++;
    var room = lobby.getRoom(data.roomUrl);
    if (room.error) {
      callback( { error: room.error });
    } else {
      room.toggleVoter(data);
      callback( {} );
    }
  });

});