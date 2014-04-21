var io = require('socket.io-client');
var socket = new io.connect("http://171.65.102.132:3006");

const redis = require('redis');
const list = redis.createClient();

var current_block_id;

const PORT = 3001;
const HOST = '171.65.102.132';

var express = require('express'),
	http = require('http'),
	server = http.createServer(app);
	
var fs  = require('fs');
	
var app = express();
var archiver = require('archiver');

socket.on('connect', function() {
	console.log("Connected to front server..");
});

socket.on('recordblock-clients', function(data){
  	current_block_id = String(data);
	console.log("RECORD ON:"+ current_block_id);
});

socket.on('stoprecordblock-clients', function(){
	archiveImages();
  	console.log("RECORD OFF //////////////");
});

function archiveImages () {
	var path = require('path');
	var dir_name = path.join('../../Dropbox','live-gallery',current_block_id);
	var file_name = path.join('../../Dropbox','live-gallery',current_block_id,"block"+current_block_id.toString()+"_images.zip");
	var output = fs.createWriteStream(file_name);
	var archive = archiver('zip');
	
	output.on('close', function(){
		console.log(archive.pointer() + ' total bytes');
		console.log('archiver has been finalized and the output file descriptor has closed.');
	});
	
	archive.on('error', function(err){
		throw err;	
	});
	
	archive.pipe(output);
	archive.bulk([
		{ expand: true, cwd: dir_name , src: ['**'], dest: dir_name }
	]);
	archive.finalize();
}
