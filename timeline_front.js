const PORT = 3006;

var redis = require('redis');

var io = require('socket.io').listen(PORT);

var list = redis.createClient();

var _ = require('underscore');

var current_block_id;
var current_block_record;

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
					//pub.publish("realtime", "0&&"+msg.led1+"^"+msg.led2+"^"+msg.led3+"^"+msg.led4);
  					break;
  				case "/arduino/#sendvalvetrigger":
  					io.sockets.emit('arduino-commands',"1&&"+"Valve triggered.");
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
        	var m = now.getMinutes();
			var s = now.getSeconds();
        	if(current_block_record){
        		if((s==0)&&(m%5==0)) {socket.emit('recordblock',current_block_id);}
        	}else{
        		if((s==0)&&(m%5==0)) {socket.emit('stoprecordblock');}
        	}
        	if((s==0)&&(m%5==3)){
        	//if(s==0){
        		socket.emit('snapshot',current_block_id);
        	}else{
        		socket.emit('tic', m+":"+s);
        	}
        });
        
        socket.on('back/arduino/#excutedRequest', function(msg){
        	socket.broadcast.emit(msg);	
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
     	current_block_record = redis_get("tb_id:"+current_block_id+":locked");
     	var test = redis_get("tb_id:"+current_block_id+":user_id");
     	
     	console.log("hello block "+current_block_id);
     	
     	//reload blocks
	}
	
	function lock_current_block(){
		list.set("tb_id:"+current_block_id+":locked", 1);
		console.log("block "+current_block_id +" locked");
		
		//reload blocks
	}
	
	function redis_get(key){
		list.get(key, function(err,res){
		if (err){
			console.log("error: "+err);
		}
			console.log(res);
			return res
		});
	}
	                                             //
	//////////////////////////////////////////////


function markTimeblock(){
	var block = 5*60*1000;
	var start = Date.UTC(2014,02,1);
	var end = new Date();
	end = end.getTime();
	var blocks = Math.floor((end-start)/block);
	
	console.log(start);
	console.log(end);
	console.log((end-start)/block);
	console.log(blocks);
     
	for (var i=0;i<(blocks-1);i++) {
		list.set("tb_id:"+i+":locked", 1);
		list.set("tb_id:"+i+":past", 1);
		list.set("tb_id:"+i+":current", 0);
	}
	list.set("tb_id:"+(blocks)+":current",1);
	current_block_id = blocks;
	console.log("current block id:"+current_block_id);
}

