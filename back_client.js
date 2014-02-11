var io = require('socket.io-client');
var socket = new io.connect("http://171.65.102.132:3002");

var five = require("johnny-five")
board = new five.Board();

const redis = require('redis');
const list = redis.createClient();

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
    });
    
    board.on('valveOpen', function(){
    	this.digitalWrite(12, 1);
	var delay = 1000; // 1000 msec delay
	var now = new Date();
	var desiredTime = new Date().setMilliseconds(now.getMilliseconds() + delay);
	while (now < desiredTime) {
    		now = new Date(); // update the current time
	}
	this.digitalWrite(12, 0);
    });
                                              //
////////////////////////////////////////////////

socket.on('connect', function() {
	console.log("Connected to front server..");
});

socket.on('message', function(msg) {
	var d = new Date().getTime();
	list.zadd("arduino_log", d , msg);
	var str = msg.split("&&");
    	switch(Number(str[0]))
		{
  			case 0:
  				var ledArray = str[1].split("^");
				board.emit('changeLED', ledArray);
  			break;
  			case 1:
  				board.emit('valveOpen', msg);
  			break;
		}
});

socket.on('disconnect', function(client) {
	console.log("Disconnected!!!");
});
