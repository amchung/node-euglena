
/**
 * Module dependencies.
 */
  
var http = require('http');

var vid_width = 640
  , vid_height = 480;
  
var Canvas = require('canvas')
  , canvas = new Canvas(vid_width, vid_height)
  , ctx = canvas.getContext('2d')
  , Image = Canvas.Image;
  
function takeSnapshot(){
	var timestamp = new Date().getTime();
	
	http.get("http://171.65.102.132:8080/?action=snapshot?t=" + timestamp, function(res) {
        res.setEncoding('binary')
        var buf = ''
        res.on('data', function(chunk){
            buf+= chunk; 
        });
        res.on('end', function(){
        	var img = new Image();
        	img.onerror = function(err){
  				throw err;
			};

  			img.onload = function(){
				ctx.drawImage(img, 0, 0, img.width, img.height);
			};
			
			img.src = new Buffer(buf, 'binary');
        });
    }).on('error', function(e) {
    	console.log("Got error: " + e.message);
    });
}

http.createServer(function (req, res) {
  takeSnapshot();
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('' + '<img src="' + canvas.toDataURL() + '" />');
}).listen(3000);
console.log('Server started on port 3000');
