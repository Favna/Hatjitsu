var http = require('http');
var path = require('path');
var bodyParser = require('body-parser');
var express = require('express');
var lobbyClass = require('./lib/lobby');
var methodOverride = require('method-override');
var socketIo = require('socket.io');

var app = express();
var server = http.createServer(app);
var io = socketIo.listen(server);

var lobby = new lobbyClass.Lobby(io);

var port = process.env.PORT || 5608;

// Configuration

app.set('views', path.join(__dirname, 'app'));
app.set('view engine', 'ejs');
app.set('view options', {
	layout: false
});

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use(methodOverride('X-HTTP-Method-Override'));

app.use(express.static(path.join(__dirname, 'app')));

app.get('/', function (_, res) {
	res.setHeader('Content-Type', 'text/html');
	res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');

	res.render('index.ejs');
});

app.get('/:id', function (req, res) {
	if (req.params.id in lobby.rooms) {
		res.render('index.ejs');
	} else {
		res.redirect('/');
	}
});

server.listen(port, function () {
	console.log(`Express server listening on http://localhost:${port}`);
});

io.configure(function () {
	io.set('transports', ['websocket', 'htmlfile', 'xhr-polling', 'jsonp-polling']);
});

io.configure('production', function () {
	io.enable('browser client minification');
	io.enable('browser client etag');
	io.enable('browser client gzip');
	io.set('polling duration', 10);
	io.set('log level', 1);
});

/* EVENT LISTENERS */

io.sockets.on('connection', function (socket) {
	socket.on('disconnect', function () {
		lobby.broadcastDisconnect(socket);
	});

	socket.on('create room', function (data, callback) {
		callback(lobby.createRoom());
	});

	socket.on('join room', function (data, callback) {
		var room = lobby.joinRoom(socket, data);
		if (room.error) {
			callback({ error: room.error });
		} else {
			callback(room.info());
		}
	});

	socket.on('room info', function (data, callback) {
		var room = lobby.getRoom(data.roomUrl);
		if (room.error) {
			callback({ error: room.error });
		} else {
			callback(room.info());
		}
	});

	socket.on('set card pack', function (data, cardPack) {
		var room = lobby.getRoom(data.roomUrl);
		if (!room.error) {
			room.setCardPack(data);
		}
	});

	socket.on('vote', function (data, callback) {
		var room = lobby.getRoom(data.roomUrl);
		if (room.error) {
			callback({ error: room.error });
		} else {
			room.recordVote(socket, data);
			callback({});
		}
	});

	socket.on('unvote', function (data, callback) {
		var room = lobby.getRoom(data.roomUrl);
		if (room.error) {
			callback({ error: room.error });
		} else {
			room.destroyVote(socket, data);
			callback({});
		}
	});

	socket.on('reset vote', function (data, callback) {
		var room = lobby.getRoom(data.roomUrl);
		if (room.error) {
			callback({ error: room.error });
		} else {
			room.resetVote();
			callback({});
		}
	});

	socket.on('force reveal', function (data, callback) {
		var room = lobby.getRoom(data.roomUrl);
		if (room.error) {
			callback({ error: room.error });
		} else {
			room.forceReveal();
			callback({});
		}
	});

	socket.on('sort votes', function (data, callback) {
		var room = lobby.getRoom(data.roomUrl);
		if (room.error) {
			callback({ error: room.error });
		} else {
			room.sortVotes();
			callback({});
		}
	});

	socket.on('toggle voter', function (data, callback) {
		var room = lobby.getRoom(data.roomUrl);
		if (room.error) {
			callback({ error: room.error });
		} else {
			room.toggleVoter(data);
			callback({});
		}
	});
});

module.exports = app;
