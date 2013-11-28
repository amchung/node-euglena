const PORT = 8088;
const HOST = '171.65.102.132';

var express = require('express'),
	http = require('http'),
	server = http.createServer(app);
	
var fs  = require('fs');
	
var app = express();

const redis = require('redis');
const client = redis.createClient();

const io = require('socket.io');
const list = redis.createClient();

const _ = require('underscore');

if (!module.parent) {
    server.listen(PORT, HOST);
    const socket  = io.listen(server);
 
    socket.on('connection', function(client) {
        const sub = redis.createClient();
        sub.subscribe('realtime');
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
  					pub.publish("realtime", "A New Challenger Enters the Ring:" + client.id +"  =  "+ msg.user);
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
  					pub.publish("realtime", msg.message);
  					break;
				default:
  					console.log("!!!received unknown input msg!!!");
		}
        });
 
        client.on('disconnect', function() {
            sub.quit();
            pub.publish("realtime","Disconnected :" + client.id);
        });
    });
}

/**************************************************************
	Game Frames
**************************************************************/

http.createServer(function (req, res) {
  clock(ctx);
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<img src="' + canvas.toDataURL() + '" />');
}).listen(3000);
console.log('Server started on port 3000');


/**************************************************************
	Snapshots of euglena stage view
**************************************************************/

var t_interval = 1000 * 60 * 30;
setInterval(takeSnapshot, t_interval);
takeSnapshot();

function takeSnapshot(){
	var timestamp = new Date().getTime();
	
	http.get("http://171.65.102.132:8080/?action=snapshot?t=" + timestamp, function(res) {
        res.setEncoding('binary')
        var imagedata = ''
        res.on('data', function(chunk){
            imagedata+= chunk; 
        });
        res.on('end', function(){
        	console.log("tmp/"+timestamp+".jpg");
        	var path = require('path');
        	var file = path.join(__dirname, 'tmp', timestamp+".jpg");
            fs.writeFile(file, imagedata, 'binary');
        });
    }).on('error', function(e) {
    	console.log("Got error: " + e.message);
    });
}

