const PORT = 3006;

var redis = require('redis');

var io = require('socket.io').listen(PORT);

var list = redis.createClient();

var _ = require('underscore');

var current_block_id;
var record_button=false;
var new_record_time=0;
var old_record_time=0;

markTimeblock();

// server_clock
var now = new Date();


	io.configure(function () {
	  //socket.set("transports", ["xhr-polling"]);
	  //socket.set("polling duration", 10);
	  //socket.set("close timeout", 10);
	  io.set("log level", 1);
	});

    const sub = redis.createClient();
    sub.subscribe('realtime');
    const pub = redis.createClient();

	io.sockets.on('connection', function(socket) {
        sub.on("message", function(channel, message) {
            socket.send(message);
        });
        
        socket.on('message', function(msg) {
        	switch(msg.type)
			{
				case "setUsername":
  					pub.publish("realtime", "0&&"+"A New Challenger Enters the Ring:" + socket.id +"  =  "+ msg.user);
  					break;
  				case "chat":
  					pub.publish("realtime", "0&&"+msg.message);
  					break;
  				case "update":
  					pub.publish("realtime", "1&&"+msg.message);
  				case "/arduino/#sendLEDarrow":
  					io.sockets.emit('arduino-commands',"0&&"+msg.led1+"^"+msg.led2+"^"+msg.led3+"^"+msg.led4);
					console.log("0&&"+msg.led1+"^"+msg.led2+"^"+msg.led3+"^"+msg.led4);
					//pub.publish("realtime", "0&&"+msg.led1+"^"+msg.led2+"^"+msg.led3+"^"+msg.led4);
  					break;
  				case "/arduino/#sendvalvetrigger":
  					io.sockets.emit('arduino-commands',"1&&"+msg.delay);
  					//pub.publish("realtime", "1&&"+"Valve triggered.");
  					break;
			}
        });
        
        socket.on("error", function (err) {
        	console.log("Error "+err);
        });
        
        socket.on('lookclock', function(){
        	function display(date){
        		// display 5 min countdown
				var m = date.getMinutes();
				var s = date.getSeconds();
				if (s>0){
					m=4-m%5;
				}else{
					m=5-m%5;
				}
				s=("0" + (60-s%60)%60).slice(-2);
				return m+":"+s;
			}
        	socket.emit('server_clock',display(now));
        });
        
        socket.on('lookimgclock', function(){
        	list.get("tb_id:"+current_block_id+":exp_id", function(err,res){
			if (err){
				console.log("error: "+err);
			}

			if(res > -1){
				record_button = true;
			}else{
				record_button = false;
			}

			//console.log("current block record on: "+current_block_record +" with exp id "+res); 

			var m = now.getMinutes();
			var s = now.getSeconds();

        		new_record_time = new Date().getTime();
			if (new_record_time - old_record_time > 100) {
			  if(record_button){
			      io.sockets.emit('recordblock-clients',current_block_id);
			      socket.emit('recordblock',current_block_id);
			      old_record_time = new_record_time;
			  }
			}

        		if((s==0)&&(m%5==4)){
        		//if(s==0){
        			socket.emit('snapshot',current_block_id);
        		}else{
        			socket.emit('tic', m+":"+s);
        		}		
		});
        	
        });
        
        socket.on('/back/arduino/#excutedRequest', function(msg){
        	//socket.broadcast.emit(msg);
        	io.sockets.emit('client-msg',msg);
        });
        
        socket.on('disconnect', function() {
            sub.quit();
            io.sockets.emit('arduino-commands',"0&&"+0+"^"+0+"^"+0+"^"+0);
            pub.publish("realtime","Disconnected :" + socket.id);
        });
    });
    
	 //////////////////////////////////////////////
	//  server clock functions
	
	// every 5 min, handle a block
	onclock(one_block);

	function onclock(cb) {
		(function loop() {
			now = new Date();      
		if (now.getSeconds() === 0){
				if (now.getMinutes()%5 == 0){
					cb(now);
				}
		}
		
		if ((now.getMinutes()%5 == 4)&&(now.getSeconds() == 50)){
					lock_current_block();
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
	    
	    // stop recording for the past block
	    if (record_button) {
		io.sockets.emit('stoprecordblock-archiver');
		io.sockets.emit('stoprecordblock');
		record_button = false;
	    }
	    
	    // new block
	    current_block_id = current_block_id+1;
	    list.set("global:current:tb_id", current_block_id);
	    list.set("tb_id:"+current_block_id+":current",1);
	    
	    /*list.get("tb_id:"+current_block_id+":locked", function(err,res){
		    if (err){
			    console.log("error: "+err);
		    }
			    if(res == 1){
				    current_block_record = true;
				    console.log("current block record on: "+current_block_record); 
			    }else{
				    current_block_record = false;
			    }
	    });*/
	    list.get("tb_id:"+current_block_id+":username", function(err,res){
		if (err){
			console.log("error: "+err);
		}else{
			var target_username = res;
			list.zadd("username:"+target_username+":tb_id", new Date().getTime(), current_block_id);
		    	list.get("tb_id:"+current_block_id+":pattern_id", function(err,res){
				if (err){
					console.log("error: "+err);
				}else{
					var pattern_id = Number(res);
					if(pattern_id > 0){
						list.get("pattern_id:" + res+":pattern", function(err,res){
							console.log("automatic execution of pattern #" + pattern_id);
						      	var message = current_block_id + "##"+ res;
						      	io.sockets.emit('execute-pattern',message);
						  });
					}
				}
		    	});
		}
	   });
	    
	    console.log("hello block "+current_block_id);    	
	    //reload blocks
	}
	
	function lock_current_block(){
		list.set("tb_id:"+current_block_id+":locked", 1);
		console.log("block "+current_block_id +" locked");
		
		//reload blocks
	}

	                                             //
	//////////////////////////////////////////////


function markTimeblock(){
	var block = 5*60*1000;
	var start = Date.UTC(2014,06,1);
	var end = new Date();
	end = end.getTime();
	var blocks = Math.floor((end-start)/block);
	
	console.log(start);
	console.log(end);
	console.log((end-start)/block);
	console.log(blocks);
    
    list.set("global:current:tb_id", blocks);
    
	for (var i=0;i<(blocks-1);i++) {
		list.set("tb_id:"+i+":locked", 1);
		list.set("tb_id:"+i+":past", 1);
		list.set("tb_id:"+i+":current", 0);
	}
	list.set("tb_id:"+(blocks)+":current",1);
	current_block_id = blocks;
	console.log("current block id:"+current_block_id);
}

