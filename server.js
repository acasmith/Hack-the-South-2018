//Currently working on: Sockets are not being removed from the queue correctly when the page is reset. Possible also when ending chat too.
console.log("Server is up.");

///////Setup///////////

var express = require('express');	//Importd express (it's a function)
//var http = require('http').Server(app);	//Creates new http-server instance.
var app = express(); //Calls the function stored in express.
var http = app.listen(3000, () => console.log("Listening on *3000")); //Creates new instance of http-server on 3000.
var io = require('socket.io')(http);	//Imports socket.io function.
app.use(express.static("public"));	//Hosts contents of public.

//Contains all non-paired sockets by category.
var freeClients = {
	movies: [],
	books: [],
	music: [],
	tech: [],
	physics: [],
};

//Largely same middleware as express.static, but only sends 1 file rather than hosting a directory (as far as I can tell)
/*app.get('/', function(req, res){
  res.sendFile("public", {root: __dirname});
});*/


/////////Message handlers/////////

//When a new user connects
io.on("connection", function(socket){
	var interest;
	var partnerDescription;
	socket.chatAccepted = false;
	console.log("A user connected");
	//When user logins in.
	socket.on("login", function(category, desc){
		socket.pastPartners = [];
		interest = category;
		socket.description = desc;
		console.log("description: " + socket.description);
		setupSession();
	});
	//When a user disconnects.
	//N.B Need a way to deal with dropouts/deliberately ending a session.
	socket.on("disconnect", function(){
		console.log("A user disconnected");
		//If user has logged in, they may be in freeClients queue.
		if(interest){
			console.log("socket removal processing");
			var result = "Socket was not in queue";
			var index = freeClients[interest.toString()].indexOf(socket);
			if(index > -1){
				freeClients[interest].splice(0, index);
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
	
	socket.on("decline", function(){
		console.log("server decline firing, roomName: " + socket.roomName);
		io.in(socket.roomName).emit("end session");
	});
	
	socket.on("new session", function(){
		console.log("server new session firing");
		socket.pastPartners.push(socket.partner);
		socket.partner = null;
		socket.leave(socket.roomName);
		socket.roomName = null;
		setupSession();
	});
	
	socket.on("accepted chat", function(){
		console.log("accepted chat fired");
		socket.chatAccepted = true;
		if(socket.partner.chatAccepted){
			io.in(socket.roomName).emit("load chat");
			socket.chatAccepted = false;
			socket.partner.chatAccepted = false;
		}
	});
	
	socket.on("session leaver", function(){
		io.in(socket.roomName).emit("session leaver");
	})
	
	//When using pure http-server, can set it listening to a port this way.
	/*http.listen(3000, function(){
	  console.log('listening on *:3000');
	});*/

	//Matches socket with first one in queue.
	//If queue is empty then adds socket to the appropriate interest queue and returns.
	function findMatch(socket, interest){
		console.log(interest + " user queue count: " + freeClients[interest.toString()].length);
		//for each element in array, place it in interest attribute of clients container.
		if(freeClients[interest.toString()].length < 1){
			freeClients[interest.toString()].push(socket);
			return;
		}
		//Iterate over sockets in same interest, return first one that hasn't been partnered to socket before.
		for(var i = 0; i < freeClients[interest.toString()].length; i++){
			if(socket.pastPartners.indexOf(freeClients[interest.toString()][i]) < 0){
				console.log("Match found!");
				return freeClients[interest.toString()][i];	//CHANGE TO SPLICE SO THE ENTRY IS REMOVED.
			}
		}
		//Else every other socket has been partnered so join the queue to wait.
		freeClients[interest.toString()].push(socket);
	}
	
	function setupSession(){
			socket.partner = findMatch(socket, interest);
			if(socket.partner){
				//Message partner with own details and get partner details.
				console.log("setup session firing");
				socket.partner.partner = socket;
				socket.roomName = socket.id + "" + socket.partner.id;
				socket.partner.roomName = socket.roomName;
				console.log("roomName: " + socket.roomName + ", " + socket.partner.roomName);
				socket.join(socket.roomName);
				socket.partner.join(socket.roomName);
				socket.to(socket.roomName).emit("give description", socket.description);
				socket.partner.to(socket.roomName).emit("give description", socket.partner.description);
			}
	}
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