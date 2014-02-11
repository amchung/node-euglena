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

var io = require('socket.io-client');
var socket_client = io.connect("http://localhost:3002");

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

socket_client.on('connect', function(client) {
	console.log("Connected to front server..");
	socket_client.emit('message', {channel:'arduino'});
}); 

socket_client.on('message', function(msg) {
        switch(msg.type)
		{
  			case "sendarrow":
				board.emit('changeLED', msg);
				var reply = {type:'gotarrow', message: "0&&"+msg.led1+"^"+msg.led2+"^"+msg.led3+"^"+msg.led4};
                		socket_client.json.send(reply);
  			break;
  			case "sendvalveopen":
  				board.emit('valveOpen', msg);
				var reply = {type:'gotvalveopen', message: "1&&"+"Valve opened..."};
                		socket_client.json.send(reply);
  			break;
  			case "sendvalveclose":
  				board.emit('valveClose', msg);
  				var reply = {type:'gotvalveopen', message: "1&&"+"Valve closed."};
                		socket_client.json.send(reply);
  			break;
		}
});


socket_client.on('disconnect', function(client) {
	console.log("Disconnected!!!");
});
