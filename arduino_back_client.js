var io = require('socket.io-client');
var socket = new io.connect("http://171.65.102.132:3006");

var five = require("johnny-five")
board = new five.Board();

const redis = require('redis');
const client = redis.createClient();

var current_block_id;
var RecordOn = false;

var myClock;

var express = require('express'),
	http = require('http'),
	server = http.createServer(app);
	
var app = express();

socket.on('connect', function() {
	console.log("Connected to clock server..");
	myClock=setInterval(function(){myTimer()},500);
});

function myTimer(){
	socket.emit('lookimgclock');
}

socket.on('tic', function(data){
	console.log(data);
});

socket.on('recordblock', function(data){
  	current_block_id = data;
  	RecordOn = true;
  	console.log("START RECORD:"+ current_block_id);	
});

socket.on('stoprecordblock', function(data){
  	current_block_id = data;
  	RecordOn = false;
  	console.log("STOP RECORD:"+ current_block_id);
});

socket.on('disconnect', function(client) {
	console.log("Disconnected!!!");
});

socket.on('arduino-commands', function(msg) {
	var d = new Date().getTime();
	if(RecordOn==true){
		var keyname = "tb_id:"+current_block_id+":arduino-log";
		client.zadd(keyname, d , msg);
	}
	var str = msg.split("&&");
    
	function redis_zadd(key,z,value){
		client.zadd(key,z,value, function(err) {
			if (err) {
			   console.error("error");
			} else {
				client.get(key, function(err, value) {
					 if (err) {
						 console.error("error");
					 } else {
						 console.log(">>>> >>"+key+" : "+ value);
						     switch(Number(str[0]))
						     {
						     	case 0:
									var ledArray = str[1].split("^");
									board.emit('changeLED', ledArray);
								break;
								case 1:
									board.emit('valveTrigger', msg);
								break;
							}
						 socket.emit('back/arduino/#excutedRequest', msg);
					 }
				});
			  }
		});
	}
});

////////////////////////////////////////////////
//  johnny-five arduino functions

board.on("ready", function(){
        this.pinMode(5, five.Pin.PWM);
        this.pinMode(6, five.Pin.PWM);
        this.pinMode(9, five.Pin.PWM);
        this.pinMode(10, five.Pin.PWM);
        this.pinMode(12, 1);
        this.analogWrite(5,0);
        this.analogWrite(6,0);
        this.analogWrite(9,0);
        this.analogWrite(10,0);
        this.digitalWrite(12, 0);
	console.log("Arduino ready to use")
});

board.on('changeLED', function(ledArray){
        this.analogWrite(5,ledArray[0]*255);
        this.analogWrite(6,ledArray[1]*255);
        this.analogWrite(9,ledArray[2]*255);
        this.analogWrite(10,ledArray[3]*255);
    });
    
board.on('valveOpen', function(){
    	this.digitalWrite(12, 1);
	/*var delay = 1000; // 1000 msec delay
	var now = new Date();
	var desiredTime = new Date().setMilliseconds(now.getMilliseconds() + delay);
	while (now < desiredTime) {
    		now = new Date(); // update the current time
	}
	this.digitalWrite(12, 0);*/
    });
    
board.on('valveClose', function(){
    	this.digitalWrite(12, 0);
	/*var delay = 1000; // 1000 msec delay
	var now = new Date();
	var desiredTime = new Date().setMilliseconds(now.getMilliseconds() + delay);
	while (now < desiredTime) {
    		now = new Date(); // update the current time
	}
	this.digitalWrite(12, 0);*/
    });
    
board.on('valveTrigger', function(){
		this.digitalWrite(12, 1);
		var delay = 1000; // 1000 msec delay
		var now = new Date();
		var desiredTime = new Date().setMilliseconds(now.getMilliseconds() + delay);
		while (now < desiredTime) {
				now = new Date(); // update the current time
		}
		this.digitalWrite(12, 0);
    });
                                              //
////////////////////////////////////////////////


/*
	onclock(one_block);

	function onclock(cb) {
		(function loop() {
			now = new Date();      
		if (now.getSeconds() === 0){
				if (now.getMinutes()%5 == 3){
					lock_current_block();
				}
				if (now.getMinutes()%5 == 0){
					cb(now);
				}
			}
			now = new Date();                  // allow for time passing
			var delay = 1000 - (now % 1000); // exact ms to next minute interval
			setTimeout(loop, delay);
		})();
	}

	function one_block(now){
     	//take a snapshot, image = image_dir
     	list.set("tb_id:"+current_block_id+":past", 1);
     	list.set("tb_id:"+current_block_id+":current", 0);
     	console.log("bye bye block "+current_block_id);
     	current_block_id = current_block_id+1;
     	list.set("tb_id:"+current_block_id+":current",1);
     	
     	list.get("tb_id:"+current_block_id+":locked", function(err,res){
		if (err){
			console.log("error: "+err);
		}
			if(res == 1){
				current_block_record = true;
			}else{
				current_block_record = false;
			}
			console.log("current block record on: "+current_block_record); 
		});
     	
     	console.log("hello block "+current_block_id);    	
     	//reload blocks
	}

*/
