const PORT = 3002;
const HOST = '171.65.102.132';

var express = require('express'),
	http = require('http'),
	server = http.createServer(app);
	
var fs  = require('fs');
	
var app = express();

var five = require("johnny-five"),
board = new five.Board();

const redis = require('redis');
const client = redis.createClient();

const io = require('socket.io');

const list = redis.createClient();

const _ = require('underscore');

if (!module.parent) {
    server.listen(PORT, HOST);
    const socket  = io.listen(server);

socket.configure(function () {
  //socket.set("transports", ["xhr-polling"]);
  //socket.set("polling duration", 10);
  //socket.set("close timeout", 10);
  socket.set("log level", 1);
});

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
    
    board.on('flushChamber', function(){
    	this.digitalWrite(12, 1);
    	setTimeout(this.digitalWrite(12, 0), 2000);
    });
 
    socket.on('connection', function(client) {
        const sub = redis.createClient();
        sub.subscribe('realtime');
		sub.subscribe('arduino');
        const pub = redis.createClient();
        
    	list.zrevrange("myset", 0 , 4, 'withscores', function(err,members){
			var lists=_.groupBy(members,function(a,b){
				return Math.floor(b/2);
			});
			console.log( _.toArray(lists) );
			client.emit("postscore",  _.toArray(lists) );
		});
 
        sub.on("message", function(channel, message) {
            client.send(message);
        });
        client.on('message', function(msg) {
        	switch(msg.type)
			{
				case "setUsername":
  					pub.publish("realtime", "1&&"+"A New Challenger Enters the Ring:" + client.id +"  =  "+ msg.user);
  					break;
				case "sendscore":
  					list.zadd("myset", msg.score , msg.user);
					list.zrevrange("myset", 0 , 4, 'withscores', function(err,members){
						var lists=_.groupBy(members,function(a,b){
							return Math.floor(b/2);
						});
						console.log( _.toArray(lists) );
						client.emit("postscore",  _.toArray(lists) );
					});
  					break;
  				case "chat":
  					pub.publish("realtime", "1&&"+msg.message);
  					break;
  				case "sendarrow":
					board.emit('changeLED', msg);
					pub.publish("arduino", "0&&"+msg.led1+"^"+msg.led2+"^"+msg.led3+"^"+msg.led4);
  					break;
  				case "sendflush":
  					board.emit('flushChamber', msg);
  					pub.publish("realtime", "1&&"+"Flushing chamber...");
  					break;
				//default:
  				//	console.log("!!!received unknown input msg!!!");
		}
        });
        client.on('disconnect', function() {
            sub.quit();
            pub.publish("realtime","Disconnected :" + client.id);
        });
    });
}

