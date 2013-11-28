var express = require('express'),
	http = require('http'),
	server = http.createServer(app);
	
var app = express();

const redis = require('redis');

var io = require('socket.io');

const list = redis.createClient();

const _ = require('underscore');
const fs  = require('fs');

const HOST = '171.65.102.132';

setInterval(function(){
    console.log("postframe");
    gameLoop();
 	//client.emit("postframe", canvas.toDataURL());
}, t_interval);

if (!module.parent) {
    server.listen(3001, HOST);
    const socket  = io.listen(server);
    socket.set('log level', 1);
 
    socket.on('connection', function(client) {
    	list.zrevrange("myset", 0 , 4, 'withscores', function(err,members){
			var lists=_.groupBy(members,function(a,b){
				return Math.floor(b/2);
			});
			console.log(">> New Connection :" + client.id);
			client.emit("postscore",  _.toArray(lists) );
		});
 
        client.on('message', function(msg) {
        	switch(msg.type)
			{
  				case "setUsername":
  					console.log(" GAME ---- "+msg.user+" entered the room");
  					break;
  				case "reqGame":
					console.log(" GAME !!!! "+msg.user+" started!!");
					resetGame(msg.user);
  					break;
  				case "reqRecord":
					//start record
					console.log(" REC :::: "+client.id+" requested");
					record_start(client.id);
  					break;
  				case "setBrConst":
					console.log(client.id+": set brown const to "+ msg.val);
					brown_const = msg.val;
  					break;
				default:
  					console.log("____err: received unknown input msg____");
			}
        });
 
        client.on('disconnect', function() {
            console.log("<< Disconnected :" + client.id);
        });
		
		function resetGame(user){
			current_player = user;
    		clearTimeout(gametimer);
        
    		ObjX = vid_width/2;
    		ObjY = vid_height/2;
        
    		score_val = 0;
    		scoreX = ObjX;
    		scoreY = ObjY;
        
    		int_timer = max_timer;
    
    		setInterval(countDown, t_interval);
		}

		function countDown(){
        	int_timer = int_timer - 1;
        	if (int_timer >-1){
        		if (int_timer > 0)
        		{
            		score_val = (Math.pow(scoreX-ObjX,2) + Math.pow(scoreY-ObjY,2))*10;
        		}
        		else
        		{
                	clearInterval(gametimer);
                	var old_score = list.zrank("myset", current_player);
                	score_val=(score_val>old_score)?score_val:old_score; 
                	list.zadd("myset", score_val , current_player);
					list.zrevrange("myset", 0 , 4, 'withscores', function(err,members){
						var lists=_.groupBy(members,function(a,b){
							return Math.floor(b/2);
						});
						console.log( _.toArray(lists) );
						client.emit("postscore",  _.toArray(lists) );
					});
                
            		int_timer= -1;
            		score_val = -1;
            		ObjX = vid_width/2;
            		ObjY = vid_height/2;
        		}
        	}
		}
    });
}

/**
 * Module dependencies.
 */
  
  
var screen_http = require('http');

var vid_width = 640
  , vid_height = 480;
  
var Canvas = require('canvas')
  , canvas = new Canvas(vid_width, vid_height)
  , ctx = canvas.getContext('2d')
  , Image = Canvas.Image;

/*******************************************************************************
  Game Main Loop
*******************************************************************************/

var t_interval = 1000/15;
var timestamp = 0;
//setInterval(gameLoop, t_interval);
//gameLoop();
  
function gameLoop(){
	timestamp = new Date().getTime();
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
  				ctx.clearRect(0, 0, vid_width, vid_height);
				ctx.drawImage(img, 0, 0, img.width, img.height);
            	// motion detection
            	compareFrame(img);
			};
			
			img.src = new Buffer(buf, 'binary');
        });
    }).on('error', function(e) {
    	console.log("Got error: " + e.message);
    });
}

/*******************************************************************************
  Game Core
*******************************************************************************/


var ObjX = vid_width/2,
	ObjY = vid_height/2,
	ObjL = 80,
	ObjR = 50,
	score_val = 0,
	scoreX = ObjX,
    scoreY = ObjY;
    
var int_timer=0;
var max_timer=t_interval*4;
var brown_const=0;
var gametimer;
var current_player;

function drawBox(box_X,box_Y,box_L,totalRes){
    ctx.strokeStyle = ( totalRes > 0 ) ? "rgba(253,172,13,1)" : "rgba(250,102,0,1)";
    ctx.lineWidth = 2;
        
    ctx.beginPath();
    ctx.rect(box_X - box_L/2, box_Y - box_L/2, box_L, box_L);
    ctx.stroke();        
    
    ctx.fillStyle = "#f00";
    ctx.beginPath();
    ctx.moveTo(box_X,box_Y);
        
    if (score_val>-1){
    	// game timer
    	var enda = (2*Math.PI)*(int_timer/max_timer);
    	ctx.arc(box_X,box_Y,box_L/4, 0, enda);
    	ctx.fill();
    
        ctx.beginPath();
        ctx.fillStyle = "#fff"; 
        ctx.fillText('score: +'+score_val,box_X - box_L/2, box_Y - box_L/2-10);
            
        ctx.moveTo(scoreX, scoreY);
        ctx.strokeStyle = "#fff";
    	ctx.lineWidth = 1;
        ctx.lineTo(ObjX, ObjY);
        ctx.stroke();        
    }
}

function resetBox(){
    ObjX = vid_width/2;
    ObjY = vid_height/2;
}


/*******************************************************************************
  Motion Detection adopted from Tom Stoeveken's mjpg-streamer examples
*******************************************************************************/

var img1 = null;
var img2 = null;
var md_canvas = new Canvas(vid_width, vid_height);

function compare(image1, image2, ptX, ptY, threshold, ObjR) {
  var movement = new Array(0,0,0,0);
  var md_ctx = md_canvas.getContext("2d");
  var width = md_canvas.width/2, height = md_canvas.height/2;

  // copy images into canvas element
  // these steps scale the images and decodes the image data
  md_ctx.drawImage(image1, 0, 0, width, height);
  md_ctx.drawImage(image2, width, 0, width, height);

  // this makes r,g,b,alpha data of images available
  var pixels1 = md_ctx.getImageData(0, 0, width, height);
  var pixels2 = md_ctx.getImageData(width, 0, width, height);
  
  // substract picture1 from picture2
  // if they differ set color value to max,
  // if the difference is below threshold set difference to 0.
  for (var x = Math.round((ptX-ObjR)/2); x < Math.round((ptX+ObjR)/2); x++) {
    for (var y = Math.round((ptY-ObjR)/2); y < Math.round((ptY+ObjR)/2); y++) {

      // each pixel has a red, green, blue and alpha value
      // all values are stored in a linear array
      var i = x*4 + y*4*pixels1.width;

      var ch0 = ((pixels1.data[i] - pixels2.data[i])>threshold)?255:0;
      var ch1 = ((pixels1.data[i] - pixels2.data[i])>threshold)?255:0;
      var ch2 = ((pixels1.data[i] - pixels2.data[i])>threshold)?255:0;

      // count differing pixels
      var n = (x<Math.round(ptX/2))?0:1;
      var m = (y<Math.round(ptY/2))?0:2;
      movement[n+m] += Math.min(1, ch0 + ch1 + ch2);
    }
  }
  return movement;
}


function compareFrame(img1) {
  // just compare if there are two pictures
  if ( img2 != null ) {
    var res;

    try {
      // compare the two pictures, the given threshold helps to ignore noise
      res = compare(img1, img2, ObjX, ObjY, 6, ObjR); 
    }
    catch(e) {
      // errors can happen if the pictures were corrupted during transfer
      // instead of giving up, just proceed
    }
    
    var md_ctx = md_canvas.getContext("2d");
    if ((res[0]>400)||(res[1]>400)||(res[2]>400)||(res[3]>400)){
            res[0]=0;res[1]=0;res[2]=0;res[3]=0;
    }
    
    var objx=ObjX+(res[0]+res[2]-res[1]-res[3])/4+(Math.random()-0.5)*20*brown_const;
    var objy=ObjY+(res[0]+res[1]-res[2]-res[3])/4+(Math.random()-0.5)*20*brown_const;
    
    ObjX=Math.max(objx,ObjR);
    ObjX=Math.min(ObjX,vid_width-ObjR);
    ObjX=Math.round(ObjX/2)*2;
    ObjY=Math.max(objy,ObjR);
    ObjY=Math.min(ObjY,vid_height-ObjR);
    ObjY=Math.round(ObjY/2)*2;

    drawBox(ObjX,ObjY,ObjL,res[0]+res[1]+res[2]+res[3]);
        
    ctx.fillStyle = 'white';
	ctx.fillText('[ '+ timestamp +' ]    ObjX: '+(ObjX-vid_width/2)+'    ObjY: '+(ObjY-vid_height/2)+'    BrConst: '+brown_const, 10, 10);
  }
  // copy reference of img1 to img2
  img2 = img1;
  
  var out = fs.createWriteStream(__dirname + '/tmp/frame.png')
  , stream = canvas.createPNGStream();

	stream.on('data', function(chunk){
		console.log('stream written');
  		out.write(chunk);
  	});
}

/*******************************************************************************
  Record Rendered Live Game Screen
*******************************************************************************/

var rec_user;
var rec_interval;
var rec_i = 0;

function record_start(id){
	rec_user = id;
	rec_i = 0;
	// create temporary folder
	var path = require('path');
	fs.mkdir(path.join(__dirname,'rec_tmp',rec_user), 0777, function (err){
	    if (err) {
        	console.log(err);
    	} else {
       		console.log(" REC :::: "+'Directory created');
       		rec_interval=setInterval(record_loop, 1000/24);
    	}
	});
}

function record_loop(){
	if(rec_i>-1){
		var path = require('path');
		var img = canvas.toDataURL();
		var data = img.replace(/^data:image\/\w+;base64,/, "");
		var buf = new Buffer(data, 'base64');
		fs.writeFile(path.join(__dirname,'rec_tmp',rec_user,zeroFill(rec_i,4)+".png"),buf, function (err){
			if (err) {
				throw err;
			}
			else {
				console.log(" REC :::: "+rec_user+" is recording frame "+rec_i);
			}
		});
	
		if (rec_i>24*10){
			record_end();
		}
		else{
			rec_i = rec_i + 1;
		}}
	else{
		// timer overflow
	}
}

function record_end(){
	clearInterval(rec_interval);
	rec_i = -1;
	score_val = -1;
	console.log(" REC :::: "+"recording done");
	
	// encode images to video
	var ffmpeg = require('fluent-ffmpeg');
	var path = require('path');
	var proc = new ffmpeg({ source: path.join(__dirname,'rec_tmp',rec_user,'%04d'+".png"), nolog: true })
 		.withFps(24)
  		.saveToFile(path.join(__dirname,'rec_tmp',rec_user+".mp4"), function(retcode, error){
  		if (error) {
			throw error;
		}
		else {
			console.log(" REC :::: "+rec_user+" recorded video successfully.");
		}
	});
	
	//remove temporary folder and files
	
} 

function zeroFill( number, width )
{
  width -= number.toString().length;
  if ( width > 0 )
  {
    return new Array( width + (/\./.test( number ) ? 2 : 1) ).join( '0' ) + number;
  }
  return number + ""; // always return a string
}