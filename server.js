//Currently working on: Refactoring code into a readable style, lookup best practices.
console.log("Server is up.");

///////Setup///////////

var express = require('express');	//Importd express (it's a function)
//var http = require('http').Server(app);	//Creates new http-server instance.
var app = express(); //Calls the function stored in express.
var http = app.listen(3000, () => console.log("Listening on *3000")); //Creates new instance of http-server on 3000.
var io = require('socket.io')(http);	//Imports socket.io function.
app.use(express.static("public"));	//Hosts contents of public.
var chatMatch = require("chatMatch");


//Largely same middleware as express.static, but only sends 1 file rather than hosting a directory (as far as I can tell)
/*app.get('/', function(req, res){
  res.sendFile("public", {root: __dirname});
});*/


/////////Message handlers/////////

//When a new user connects
io.on("connection", function(socket){
	var partnerDescription;
	socket.chatAccepted = false;
	console.log("A user connected");
	//When user logins in.
	socket.on("login", function(category, desc){
		socket.pastPartners = [];
		socket.interest = category;
		socket.description = desc;
		console.log("description: " + socket.description);
		chatMatch.setupSession(socket);
	});
	//When a user disconnects.
	socket.on("disconnect", function(){
		console.log("A user disconnected");
		//If logged in, check if they're in queue and remove.
		if(socket.interest){
			console.log("socket removal processing");
			console.log("Queue for " + socket.interest + ":" + freeClients[socket.interest]);
			var result = "Socket was not in queue";
			var index = freeClients[socket.interest].indexOf(socket);
			if(index > -1){
				freeClients[socket.interest].splice(index, 1);
				result = "socket removal successful";
			}
			console.log(result);
		}
	});
	//When a chat message is sent, send it to the whole room including sender.
	socket.on("chat message", function(msg){
		console.log("message: " + msg);
		io.in(socket.roomName).emit('chat message', msg);
		
	});
	//User declines roulette offer.
	socket.on("decline", function(){
		console.log("server decline firing, roomName: " + socket.roomName);
		io.in(socket.roomName).emit("end session");
	});
	//Ends current session and starts a new one.
	socket.on("new session", function(){
		console.log("server new session firing");
		socket.pastPartners.push(socket.partner);
		socket.partner = null;
		socket.leave(socket.roomName);
		socket.roomName = null;
		chatMatch.setupSession(socket);
	});
	//User accepts roulette offer.
	socket.on("accepted chat", function(){
		console.log("accepted chat fired");
		socket.chatAccepted = true;
		if(socket.partner.chatAccepted){
			io.in(socket.roomName).emit("load chat");
			socket.chatAccepted = false;
			socket.partner.chatAccepted = false;
		}
	});
	//Notifies partner of session leaver.
	socket.on("session leaver", function(){
		io.in(socket.roomName).emit("session leaver");
	})
	
	//When using pure http-server, can set it listening to a port this way.
	/*http.listen(3000, function(){
	  console.log('listening on *:3000');
	});*/


});

/*
//What did I learn from this hack? 
 - Team work across language barriers (chinese, bulgarian).
 - Other people (especially non-technical) have great ideas I'd never think of (ie. chat panic button to auto generate response).
 - Trying to explain technical concepts to non-technical people who have lots of enthusiasm.
 - Highly stimulating creative environment, social skills and compromise over design.
 
DESIGN: Original
 - Tinder style for conversation.
 - App flow:
	- Login
	- First login select likes from mandatory categories.
	- Select your topic to talk about.
	- Browse other people by topic tinder style (swipe right to initiate chat, swipe left to skip, X to never talk about this). Match people based on similar categories.
	- Potentially user controlled reveal of personal data based on conversation flow (over time, users choose to do so by mutual consent.)
	- Rate quality of conversation afterward to weed out trolls faking topics/bad convos. Find some reward mechanism here too/anti-cheat mechanism if both ratings are congruent?
	- Have conversation starters/questions to auto-drop in at the start of the chat to get things moving.
	- Potentially panic button to auto-generate reply when you're like "er...blank".
Basic Design: no profile mathching, just enter a username, choose topic from predefined list, browse people by topic tinder style. After choosing category allow people to add own specifics to choose.

*/