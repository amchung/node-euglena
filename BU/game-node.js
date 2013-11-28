const redis = require('redis');
const game = redis.createClient();

var ObjX=0;
var ObjY=0;
/*******************************************************************

Motion Detection and Game Objects

********************************************************************/

main();

function main(){
    var img = new Image();
	img.onload = function() {
		console.log('DL: ' + img.src);
    	// motion detection
    	compareFrame(img);
		//update arrays
    	game.set("ObjX", ObjX);
    	game.set("ObjY", ObjY);
    	setInterval(main(),30);
	};
	img.src = "http://171.65.102.132:8080/?action=snapshot?t=" + new Date().getTime();
}

var img1 = null;
var img2 = null;
var md_canvas = null;

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


////////////////////////////////////////////////
function resetGame(){
	window.clearTimeout(gametimer);
	
	ObjX = vid_width/2;
	ObjY = vid_height/2;
	
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
		ObjX = vid_width/2;
		ObjY = vid_height/2;
	}
}