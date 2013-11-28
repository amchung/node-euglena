var obj_canvas,
obj_c,
ObjX,
ObjY,
ObjL=80,
cp_canvas = null;

var video_canvas,
video_c;

var brown_const=0;
var int_timer=0;
var max_timer=30;

var scoreX = 0;
var scoreY = 0;
var score_val = 0;
var gametimer;

var vid_width = 640;
var vid_height = 480;

function setupVidCanvas() {
	// Show loading notice
	video_canvas = document.getElementById('videoCanvas');
	video_c = video_canvas.getContext('2d');
	//video_c.fillStyle = '#444';
	//video_c.fillText('Loading...', video_canvas.width/2-30, video_canvas.height/3);

	// Setup the WebSocket connection and start the player
	//var client = new WebSocket( 'ws://171.65.102.132:8084/' );
	//var player = new jsmpeg(client, {canvas:video_canvas});
	
	video_canvas.width = vid_width;
	video_canvas.height = vid_height;
	
	getMjpeg();
}

function getMjpeg(){
    var img = new Image();
	img.onload = function() {
    	video_c.drawImage(img, 0, 0, vid_width, vid_height);
    	// motion detection
    	compareFrame(img);
    	// load frame
    	requestAnimFrame(getMjpeg);
	};
	img.src = "http://171.65.102.132:8080/?action=snapshot?t=" + new Date().getTime();
}

/*function getMjpeg(){
	var frameDelta = Date.now() - frameLastUpdateTime;
    
    if (frameACDelta > msMovieFrame)
    {
        frameACDelta = 0;
        var img = new Image();
		img.onload = function() {
    		video_c.drawImage(img, 0, 0, img.width * (window.innerHeight/img.height), window.innerHeight);
		};
		img.src = "http://171.65.102.132:8080/?action=snapshot?t=" + new Date().getTime();
    } else
    {
        frameACDelta += frameDelta;
    }
    
    frameLastUpdateTime = Date.now();
    img1.onload=requestAnimFrame(getMjpeg);
}*/

function setupObjCanvas() {
    obj_canvas = document.getElementById('objCanvas');  
    obj_c = obj_canvas.getContext('2d');
    obj_canvas.width = vid_width;
	obj_canvas.height = vid_height;
		
	ObjX = vid_width/2;
	ObjY = vid_height/2;
    
    drawBox(ObjX,ObjY,ObjL);
}

function drawBox(box_X,box_Y,box_L,totalRes){
	obj_c.clearRect(0, 0, obj_canvas.width, obj_canvas.height);
	obj_c.strokeStyle = ( totalRes > 0 ) ? "rgba(253,172,13,1)" : "rgba(250,102,0,1)";
    obj_c.lineWidth = 2;
	
	obj_c.beginPath();
	obj_c.rect(box_X - box_L/2, box_Y - box_L/2, box_L, box_L);
    obj_c.stroke();	
    
    obj_c.fillStyle = "#f00";
	obj_c.beginPath();
	obj_c.moveTo(box_X,box_Y);
	var enda = (2*Math.PI)*(int_timer/max_timer);
	obj_c.arc(box_X,box_Y,box_L/4, 0, enda);
	obj_c.fill();
	
	if (score_val>0){
		obj_c.beginPath();
    	obj_c.fillStyle = "#fff"; 
    	obj_c.fillText('score: +'+score_val,box_X - box_L/2, box_Y - box_L/2-10);
    	
    	obj_c.moveTo(scoreX, scoreY);
    	obj_c.strokeStyle = "#fff";
    	obj_c.lineWidth = 1;
		obj_c.lineTo(ObjX, ObjY);
    	obj_c.stroke();	
    }
}

function resetGame(){
	window.clearTimeout(gametimer);
	
	ObjX = obj_canvas.width/2;
	ObjY = obj_canvas.height/2;
	
	score_val = 0;
	scoreX = ObjX;
	scoreY = ObjY;
	
	int_timer = max_timer;
	
	gametimer=requestAnimFrame(countDown);
}

function countDown(){
	int_timer = int_timer - 0.1;
	if (int_timer > 0){
		score_val = (Math.pow(scoreX-ObjX,2) + Math.pow(scoreY-ObjY,2))*10;
		gametimer=requestAnimFrame(countDown);
	}else{
		window.clearTimeout(gametimer);
		
		var msg = {type:'sendscore', user:username, score:score_val};
		socket.json.send(msg);
		
		int_timer=0;
		score_val = 0;
		ObjX = obj_canvas.width/2;
		ObjY = obj_canvas.height/2;
	}
}




/*******************************************************************************
  Copyright (C) 2009 Tom Stoeveken
  This program is free software;
  you can redistribute it and/or modify it under the terms of the
  GNU General Public License, version 2.
  See the file COPYING for details.
*******************************************************************************/

var img1 = null;
var img2 = null;
var md_canvas = null;

/*
  compare two images and count the differences

  input.: image1 and image2 are Image() objects
  input.: threshold specifies by how much the color value of a pixel
          must differ before they are regarded to be different

  return: number of different pixels
*/

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
      //var ch0 = (Math.abs(pixels1.data[i] - pixels2.data[i])>threshold)?255:0;
      //var ch1 = (Math.abs(pixels1.data[i] - pixels2.data[i])>threshold)?255:0;
      //var ch2 = (Math.abs(pixels1.data[i] - pixels2.data[i])>threshold)?255:0;

      // count differing pixels
      var n = (x<Math.round(ptX/2))?0:1;
      var m = (y<Math.round(ptY/2))?0:2;
      movement[n+m] += Math.min(1, ch0 + ch1 + ch2);
    }
  }
  return movement;
}

/*
  Callback function for completed picture downloads

  With every new picture a compare() is performed.
  The new picture is 'img1', the previous picture is stored in 'img2'.
*/
function compareFrame(img1) {
  // just compare if there are two pictures
  if ( img2 != null ) {
    var res;
    var ObjR=50;

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
  }
  // copy reference of img1 to img2
  img2 = img1;
}



/*
  Initialize the elements

  * Create a Canvas() object and insert it into the page
  * Download the first image
  * Pause the Livestream again if we were paused previously
    This way we will not pause, but we will lower the refresh rate
    For a proper pause, the page can not be reloaded
*/
function setupMotionDetection() {
  md_canvas = document.getElementById('mdCanvas');
  test_canvas = document.getElementById('testCanvas');
  md_canvas.width = vid_width;
  md_canvas.height = vid_height;
}