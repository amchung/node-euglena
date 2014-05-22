var io = require('socket.io-client');
var socket = new io.connect("http://171.65.102.132:3006");

const redis = require('redis');
const list = redis.createClient();

var current_block_id;

const PORT = 3002;
const HOST = '171.65.102.132';

var fs = require('fs');
var archiver = require('archiver');
var path = require('path');
var arch_button = true;

var express = require('express'),
	http = require('http'),
	server = http.createServer(app);

var app = express();

socket.on('connect', function() {
	console.log("Connected to front server..");
});

socket.on('recordblock-clients', function(data){
  	current_block_id = String(data);
	console.log("RECORD ON:"+ current_block_id);
});

socket.on('stoprecordblock-clients', function(){
	if(arch_button){
		arch_button = false;
		archiveImages((current_block_id).toString());
  		console.log("RECORD OFF //////////////");
	}
});

/*socket.on('get-zip', function(data){
	//archiveImages(current_block_id.toString());
	archiveImages(data.toString());
  	console.log("Made block "+data+" zip file");
});*/

function archiveImages (id) {
	var dir_name = path.join('../../Dropbox','live-gallery',id);
	var file_name = path.join('../../Dropbox','zip',"block_"+id+"_images.zip");
	var output = fs.createWriteStream(file_name);
	var archive = archiver('zip');
	
	output.on('close', function(){
		console.log(archive.pointer() + ' total bytes');
		console.log('archiver has been finalized and the output file descriptor has closed.');
		arch_button = true;
	});
	
	archive.on('error', function(err){
		throw err;	
	});
	
	archive.pipe(output);
	archive.bulk([
		{ expand: true, cwd: dir_name , src: ['*.jpg'] }
	]);
	archive.finalize();
}

/*******************************************************************************
  Serve zip files
*******************************************************************************/

app.use(express.static('../../Dropbox/zip'));
app.use(express.directory('../../Dropbox/zip'));
app.get('/', function(req, res) {
	res.send('hello world');
});
app.listen(PORT);
