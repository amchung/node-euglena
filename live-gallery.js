const PORT = 3000;
const HOST = '171.65.102.132';

var express = require('express'),
	http = require('http'),
	server = http.createServer(app);
	
var fs  = require('fs');
	
var app = express();

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

var snapshot_t_interval = 1000 * 60 * 10; // every minute
setInterval(takeSnapshot, snapshot_t_interval);
takeSnapshot();

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
        });
    }).on('error', function(e) {
      		console.log("Got error: " + e.message);
	});
}
