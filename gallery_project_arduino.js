//var io = require('socket.io-client');

var five = require("johnny-five")
board = new five.Board();

var servoR, servoL;


const redis = require('redis');
const client = redis.createClient();

/*var express = require('express'),
	http = require('http'),
	server = http.createServer(app);
	
var app = express();
*/

function test(){
	board.emit('stepForward');
	//board.emit('turnRight');
	//board.emit('turnLeft');
}

function lookup_redis(){
	client.get("global:next_button", function(err,res){
		    if (err){
			    console.log("error: "+err);
		    }else{
			    if(res == "forward"){
				    console.log(res); 
			    }else{
				    console.log(res);
			    }
			    setTimeout(lookup_redis,500);
		    }
	    });
}

////////////////////////////////////////////////
//  johnny-five arduino functions

board.on("ready", function(){
	servoR = new five.Servo({
	    pin: 9, 
	    type: "continuous"
	});

	servoL = new five.Servo({
	    pin: 10, 
	    type: "continuous"
	});
	
	console.log("Arduino ready to use");
	
	lookup_redis();
});

board.on('stepForward', function(ledArray){
        servoR.ccw(1);
	servoL.cw(1);
	setTimeout(resetAll, 500);
});

board.on('stepBackward', function(){
	servoR.cw(1);
	servoL.ccw(1);
	setTimeout(resetAll, 500);
});

board.on('turnRight', function(){
	servoR.ccw(1);
	setTimeout(resetAll, 500);
});

board.on('turnLeft', function(){
	servoL.ccw(1);
	setTimeout(resetAll, 500);
});

board.on('resetAll', function(){
	servoR.cw(0);
	servoL.cw(0);
});

                                              //
////////////////////////////////////////////////
