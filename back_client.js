var io = require('socket.io-client');
var socket = new io.connect("http://171.65.102.132:3002");

var five = require("johnny-five")
board = new five.Board();

////////////////////////////////////////////////
//  johnny-five arduino functions

board.on("ready", function(){
        this.pinMode(5, five.Pin.PWM);
        this.pinMode(6, five.Pin.PWM);
        this.pinMode(9, five.Pin.PWM);
        this.pinMode(10, five.Pin.PWM);
        this.pinMode(12, 1);
        this.analogWrite(5,0);
        this.analogWrite(6,0);
        this.analogWrite(9,0);
        this.analogWrite(10,0);
        this.digitalWrite(12, 0);
	console.log("Arduino ready to use")
});

    board.on('changeLED', function(ledArray){
        this.analogWrite(5,ledArray[0]*255);
        this.analogWrite(6,ledArray[1]*255);
        this.analogWrite(9,ledArray[2]*255);
        this.analogWrite(10,ledArray[3]*255);
        
        var reply = {type:'gotarrow', message: "0&&"+ledArray[0]+"^"+ledArray[1]+"^"+ledArray[2]+"^"+ledArray[3]};
		//console.log(reply.message);
        socket.json.send(reply);
    });
    
    board.on('valveOpen', function(){
    	this.digitalWrite(12, 1);
    });
    
    board.on('valveClose', function(){
    	this.digitalWrite(12, 0);
    });
                                              //
////////////////////////////////////////////////

socket.on('connect', function() {
	console.log("Connected to front server..");
	socket.emit('message', {channel:'arduino'});
});

socket.on('message', function(msg) {
	console.log(msg);
	var str = msg.split("&&");
    switch(Number(str[0]))
		{
  			case 0:
  				var ledArray = str[1].split("^");
				board.emit('changeLED', ledArray);
  			break;
  			case 1:
  				board.emit('valveOpen', msg);
				var reply = {type:'gotvalveopen', message: "1&&"+"Valve opened..."};
				console.log(reply.message);
                socket_client.json.send(reply);
  			break;
  			case 2:
  				board.emit('valveClose', msg);
  				var reply = {type:'gotvalveopen', message: "1&&"+"Valve closed."};
  				console.log(reply.message);
                socket_client.json.send(reply);
  			break;
		}
});

socket.on('disconnect', function(client) {
	console.log("Disconnected!!!");
});
