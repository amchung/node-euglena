var io = require('socket.io-client');
var socket = new io.connect("http://171.65.102.132:3006");

const redis = require('redis');
const list = redis.createClient();

var current_block_id;
var myClock;
var oldtime = 0;

const PORT = 3001;
const HOST = '171.65.102.132';

var express = require('express'),
	http = require('http'),
	server = http.createServer(app);
	
var fs  = require('fs');
	
var app = express();

socket.on('connect', function() {
	console.log("Connected to front server..");
	myClock=setInterval(function(){myTimer()},200);
});

function myTimer(){
	socket.emit('lookimgclock');
}

socket.on('tic', function(data){
	if (data != oldtime){
		console.log(data);
	}
	oldtime = data;
});

socket.on('recordblock', function(data){
  	current_block_id = String(data);
  	var imgpath = takeRecordShot(current_block_id);
  	/* var keyname = "tb_id:"+current_block_id+":image";
            console.log(keyname);
			list.set(keyname, isoDate+".jpg");*/
  	console.log("RECORD ON:"+ current_block_id);
});

socket.on('stoprecordblock', function(){
  	//current_block_id = data;
  	console.log("RECORD OFF //////////////");
});

socket.on('snapshot', function(data){
	current_block_id = String(data);
  	var imgpath = takeSnapshot();
  	console.log(current_block_id);
});

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
        	var file = path.join('../../Dropbox','live-gallery', isoDate+".jpg");
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

function takeRecordShot(dir){
  var timestamp = new Date().getTime();
  
  http.get("http://171.65.102.132:8080/?action=snapshot?t=" + timestamp, function(res) {
        res.setEncoding('binary');
        var imagedata = '';
        res.on('data', function(chunk){
            imagedata+= chunk; 
        });
        res.on('end', function(){
        	var isoDate = new Date(timestamp).toISOString();
        	console.log("live-gallery/"+dir+"/"+isoDate+".jpg");
        	var path = require('path');
        	var file = path.join('../../Dropbox','live-gallery',dir,isoDate+".jpg");
        	fs.exists('../../Dropbox/live-gallery/'+dir, function (exists) {
  				if (!exists){
  					fs.mkdir('../../Dropbox/live-gallery/'+dir, callback)
  				}else{
  					callback();
  				}
  				
  				function callback(){
  					fs.writeFile(file, imagedata, 'binary');
  				}
  				return isoDate
			});
        });
    }).on('error', function(e) {
      		console.log("Got error: " + e.message);
      		return "err"
	});
}

