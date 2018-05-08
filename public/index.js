//On page load, this happens.
$(function () {
	//Socket to connect with server.
	var socket = io();
	//HTML for chat pane.
	var chatPane = "<div id='menu' style='align-items:right'><input id='endChat' type='button' value='End Chat'></div>" + "<ul id=\"messages\"></ul>" +
    "<form action=\"\">" +
      "<input id=\"m\" autocomplete=\"off\" /><button>Send</button>" +
    "</form>";
	//HTML for roulette.
	var roulette = '<div id="decline" style = "float:left; margin-left:10%;"><--<button id="declineButton">Decline</button></div>' + '<div id="mainTile" style="margin: 0 auto; width: 30%; height: 50%; background: rgb(130, 224, 255); margin-top:25%;">a</div>' + 
					'<div id="accept" style ="float:right; margin-right:10%;"><button id="acceptButton">Start Chatting</button>--></div>';
	
	var userName;
	var interestArr;
	var interest;
	var description;
	var partnerDescription;
	var partnerName;
	
	//Checks user has entered a non-empty username and starts the chat process.
	//Currently usernames ARE NOT UNIQUE. The server knows nothing about them.
	$("#login").click(function(){
		userName = $("#userName").val();
		interestArr = ["movies", "books", "music", "tech", "physics"];
		
		//Checks username is non-empty.
		if(userName == ""){
			$("#userName").attr("placeHolder", "Please enter a user name");
			return;
		}
		
		//Iterates over categories to see if checked.
		interestArr.forEach(function(element){
			if($("#" + element).is(":checked")){
				interest = element;
			}
		});
		
		//Displays prompt text if no interest was chosen.
		if(!interest){
			$("#interestDiv").html($("#interestDiv").html() + "<p>Please select a topic of conversation</p>");
			return;
		}
		
		description = $("#categoryDescription").val() == "" ? "This user prefers to keep an air of mystery about them" : $("#categoryDescription").val();
		
		//Starts the login process.
		socket.emit("login", interest, description);
		
		//Sends desciption to partner.
		socket.on("get description", function(id){
			console.log("get desc fired, id: " + id);
			socket.emit("own details", description, id);
		});
		
		//Receives partner desciption.
		socket.on("give description", function(desc){
			console.log("give desc fired");
			partnerDescription = desc;
			loadRoulette(userName, interest, partnerDescription, socket);
		});
		
		/*function leaveRoom(socket){
		}*/
		
		socket.on("end session", function(){
			console.log("client ending session");
			$("body").html("<em>Matching you with a new partner...</em>");
			socket.emit("new session");
		});
		
		//Filler text whilst matchmaking.
		$("body").html("<em>Matching you with a new partner...</em>");
		
	});
	
	
	
	//Loads partner selection roulette.
	function loadRoulette(userName, interest, partnerDescription, socket){
		$("body").html(roulette);
		
		//Sets main tile to display partner details. 
		$("#mainTile").html("<h3>" + interest + "</h3> " + "<p><em>Your partner says...</em></p>" + "<p>" + partnerDescription + "</p>");
		
		//When user declines chat.
		$("#declineButton").click(function(){
			console.log("declining");
			socket.emit("decline");
		});
		
		//When user accepts chat.
		$("#acceptButton").click(function(){
			socket.emit("accepted chat");
			socket.on("load chat", function(){
				loadChat(userName);
			});
		});	
	}
	
	//Loads the chat pane into the page, sets up chat related event and message listeners.
	function loadChat(userName){
		//Displays chat page.
		$("body").html(chatPane);
		//Displays received messages.
		socket.on("chat message", function(msg){
			if($("#newest")){
				$("#newest").attr("id", "");
			}
			$('#messages').append($('<li id="newest">').text(msg));
			$('#newest')[0].scrollIntoView();
		});
		//Form submit function.
		$('form').submit(function(){
		  socket.emit('chat message', userName + ": " + $('#m').val());
		  $('#m').val('');
		  return false;
		});
		//end chat session. Cotnacts server to create a new one.
		$('#endChat').click(function(){
			if(confirm("Are you sure you want to leave the conversation?")){
				$("body").html("<em>Matching you with a new partner...</em>");
				socket.emit("session leaver");
				socket.emit('new session');
			}
		});
		
		socket.on("session leaver", function(){
			$('#messages').append($("<li>").text("Your partner has left the session."));
		});
			
	}
});
