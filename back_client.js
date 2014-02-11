var io = require('socket.io-client');
var socket = new io.connect("http://171.65.102.132:3002");

var five = require("johnny-five");
/*
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

    board.on('changeLED', function(arrow){
        this.analogWrite(5,arrow.led1*255);
        this.analogWrite(6,arrow.led2*255);
        this.analogWrite(9,arrow.led3*255);
        this.analogWrite(10,arrow.led4*255);
    });
    
    board.on('valveOpen', function(){
    	this.digitalWrite(12, 1);
    });
    
    board.on('valveClose', function(){
    	this.digitalWrite(12, 0);
    });
                                              //
////////////////////////////////////////////////
*/
socket.on('connect', function() {
	console.log("Connected to front server..");
	socket.emit('message', {channel:'arduino'});
	//board = new five.Board();
});

socket.on('message', function(msg) {
    switch(msg.type)
		{
  			case "sendarrow":
				board.emit('changeLED', msg);
				var reply = {type:'gotarrow', message: "0&&"+msg.led1+"^"+msg.led2+"^"+msg.led3+"^"+msg.led4};
				console.log(reply.message);
                socket_client.json.send(reply);
  			break;
  			case "sendvalveopen":
  				board.emit('valveOpen', msg);
				var reply = {type:'gotvalveopen', message: "1&&"+"Valve opened..."};
				console.log(reply.message);
                socket_client.json.send(reply);
  			break;
  			case "sendvalveclose":
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
