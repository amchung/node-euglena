var io = require('socket.io-client');
var socket = new io.connect("http://171.65.102.132:3006");

const redis = require('redis');
const list = redis.createClient();

var current_block_id;
var myClock;

const PORT = 3001;
const HOST = '171.65.102.132';

var express = require('express'),
	http = require('http'),
	server = http.createServer(app);
	
var fs  = require('fs');
	
var app = express();

socket.on('connect', function() {
	console.log("Connected to front server..");
	myClock=setInterval(function(){myTimer()},500);
});

function myTimer(){
	socket.emit('lookimgclock');
}

/*socket.on('recordblock', function(data){
  	console.log(data);
  	current_block_id = data;	
});*/
socket.on('tic', function(data){
	console.log(data);
});

socket.on('snapshot', function(data){
	current_block_id = data;
  	var imgpath = takeSnapshot();
  	console.log(current_block_id);
});

/*
socket.on('message', function(msg) {
	var d = new Date().getTime();
	//list.zadd("image_log", d , msg);
	//console.log(d+": " +msg);
	
	var str = msg.split("&&");
    	switch(Number(str[0]))
		{
  			case 0:
  				// snapshot only at 3:00
  				var current_block_id = str[1];
  				var imgpath = takeSnapshot();
				console.log("tb_id:"+current_block_id+":image");
				console.log(imgpath);
				list.set("tb_id:"+current_block_id+":image",imgpath);
  			break;
  			case 1:
  				// recording the entire block
  			break;
		}
});*/

socket.on('disconnect', function(client) {
	console.log("Disconnected!!!");
});

/*******************************************************************************
  Show Euglena Live Screen Gallery
*******************************************************************************/

app.use(express.static('../../Dropbox/live-gallery'));
app.use(express.directory('../../Dropbox/live-gallery'));
app.get('/', function(req, res) {
	res.send('hello world');
});
app.listen(PORT);

/*******************************************************************************
  Capture Euglena Live Screen
*******************************************************************************/

/*var snapshot_t_interval = 1000 * 60 * 10; // every minute
setInterval(takeSnapshot, snapshot_t_interval);
takeSnapshot();*/

function takeSnapshot(){
  var timestamp = new Date().getTime();
  
  http.get("http://171.65.102.132:8080/?action=snapshot?t=" + timestamp, function(res) {
        res.setEncoding('binary');
        var imagedata = '';
        res.on('data', function(chunk){
            imagedata+= chunk; 
        });
        res.on('end', function(){
        	var isoDate = new Date(timestamp).toISOString();
        	console.log("live-gallery/"+isoDate+".jpg");
        	var path = require('path');
        	var file = path.join('../../Dropbox', 'live-gallery', isoDate+".jpg");
            fs.writeFile(file, imagedata, 'binary');
            var keyname = "tb_id:"+current_block_id+":image";
            console.log(keyname);
			list.set(keyname, isoDate+".jpg");
            return isoDate
        });
    }).on('error', function(e) {
      		console.log("Got error: " + e.message);
      		return "err"
	});
}

