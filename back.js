const PORT = 3004;
const HOST = '171.65.102.132';

var express = require('express'),
	http = require('http'),
	server = http.createServer(app);
	
var app = express();

var five = require("johnny-five"),
board = new five.Board();

const redis = require('redis');
const client = redis.createClient();

const io = require('socket.io');


if (!module.parent) {
    server.listen(PORT, HOST);
    const socket  = io.listen(server);

socket.configure(function () {
  //socket.set("transports", ["xhr-polling"]);
  //socket.set("polling duration", 10);
  //socket.set("close timeout", 10);
  socket.set("log level", 1);
});

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

    socket.on('connection', function(client) {
        const sub = redis.createClient();
		sub.subscribe('arduino');
        const pub = redis.createClient();
 
        client.on('message', function(msg) {
        	switch(msg.type)
			{
  				case "sendarrow":
					board.emit('changeLED', msg);
					pub.publish("arduino", "0&&"+msg.led1+"^"+msg.led2+"^"+msg.led3+"^"+msg.led4);
  					break;
  				case "sendvalveopen":
  					board.emit('valveOpen', msg);
  					pub.publish("realtime", "1&&"+"Valve opened...");
  					break;
  				case "sendvalveclose":
  					board.emit('valveClose', msg);
  					pub.publish("realtime", "1&&"+"Valve closed.");
  					break;
		}
        });
        client.on('disconnect', function() {
            sub.quit();
        });
    });
}

