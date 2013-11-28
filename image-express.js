const PORT = 8088;
const HOST = '171.65.102.132';

var express = require('express'),
	http = require('http'),
	server = http.createServer(app);
	
var app = express();

const redis = require('redis');
const client = redis.createClient();

const io = require('socket.io');
// score board
const list = redis.createClient();
// game arrays
const game = redis.createClient();

const _ = require('underscore');

if (!module.parent) {
    server.listen(PORT, HOST);
    const socket  = io.listen(server);
 
    socket.on('connection', function(client) {
        // for chat
        const sub = redis.createClient();
        sub.subscribe('chatting');
        const pub = redis.createClient();
        // controlling Arduino
        const hw = redis.createClient();
        hw.subscribe('hardwareControl');

        // display scores for the first time
    	list.zrevrange("myset", 0 , 4, 'withscores', function(err,members){
			var lists=_.groupBy(members,function(a,b){
				return Math.floor(b/2);
			});
			console.log( _.toArray(lists) );
			client.emit("postscore",  _.toArray(lists) );
		});
 
 		// controlling Arduino
        /*client.on('control',function(msg){
        	pub.publish("hardwareControl", msg.control);
        });
        
        hw.on("control", function(channel, control) {
        	client.send(control);
        });*/
        
        // game arrays
        client.on('updateGame'){
        	game.zrevrange("gameObjects", 0 , 4, 'withscores', function(err,members){
				var lists=_.groupBy(members,function(a,b){
					return Math.floor(b/2);
				});
				client.emit("gamearray", _.toArray(arrGame));
			});
        });
 
 		// for chat
        sub.on("message", function(channel, message) {
            client.send(message);
        });
 
        client.on('message', function(msg) {
        	switch(msg.type)
			{
				case "setUsername":
  					pub.publish("realtime", "<br />" + "**** New Challenger:" + client.id +"  =  "+ msg.user + " ****");
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
  					pub.publish("chatting", msg.message);
  					break;
				default:
  					console.log("!!!received unknown input msg!!!");
		}
        });
        
        client.on('disconnect', function() {
            sub.quit();
            hw.quit();
            pub.publish("realtime","Disconnected :" + client.id);
        });
    });
}