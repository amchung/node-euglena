var io = require('socket.io-client');
var socket = new io.connect("http://171.65.102.132:3006");
var fs  = require('fs');
var http = require('http');

const redis = require('redis');
const list = redis.createClient();

var current_block_id;
var myClock;

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
  	var locked = list.get("tb_id:"+current_block_id+":locked");
  	if (locked){
  		// record whole block
  	}else{
  		
  	}
});*/

socket.on('snapshot', function(data){
	var current_block_id = data;
  	var imgpath = takeSnapshot();
	console.log("tb_id:"+current_block_id+":image");
	console.log(imgpath);
	list.set("tb_id:"+current_block_id+":image",imgpath);
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
            return isoDate
        });
    }).on('error', function(e) {
      		console.log("Got error: " + e.message);
      		return "err"
	});
}

