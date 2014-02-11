const PORT = 3002;
const HOST = '171.65.102.132';

var express = require('express'),
	http = require('http'),
	server = http.createServer(app);
	
var app = express();

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
					pub.publish("arduino", "1&&"+msg.message);
  					break;
  				case "sendvalveopen":
  					pub.publish("arduino", "1&&"+msg.message);
  					break;
  				case "sendvalveclose":
  					pub.publish("arduino", "1&&"+msg.message);
  					break;
				case "gotarrow":
					pub.publish("realtime", "0&&"+msg.led1+"^"+msg.led2+"^"+msg.led3+"^"+msg.led4);
  					break;
  				case "gotvalveopen":
  					pub.publish("realtime", "1&&"+"Valve opened...");
  					break;
  				case "gotvalveclose":
  					pub.publish("realtime", "1&&"+"Valve closed.");
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

