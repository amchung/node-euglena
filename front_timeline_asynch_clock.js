const PORT = 3006;
const HOST = '171.65.102.132';

var express = require('express'),
	http = require('http'),
	server = http.createServer(app);
	
var app = express();

var redis = require('redis');
//var client = redis.createClient();

var io = require('socket.io');

var list = redis.createClient();

var _ = require('underscore');

var timeblock_id;

markTimeblock();

// server_clock
var now = new Date();

if (!module.parent) {
    server.listen(PORT, HOST);

	const socket  = io.listen(server);

	var rooms = ['arduino','lab'];

	socket.configure(function () {
	  //socket.set("transports", ["xhr-polling"]);
	  //socket.set("polling duration", 10);
	  //socket.set("close timeout", 10);
	  socket.set("log level", 1);
	});

	socket.on('connection', function(socket) {
        const sub = redis.createClient();
        sub.subscribe('realtime');
        const pub = redis.createClient();
        
    	list.zrevrange("myset", 0 , 4, 'withscores', function(err,members){
			var lists=_.groupBy(members,function(a,b){
				return Math.floor(b/2);
			});
			console.log( _.toArray(lists) );
			socket.emit("postscore",  _.toArray(lists) );
		});
 
        sub.on("message", function(channel, message) {
            socket.send(message);
        });
        
        socket.on('message', function(msg) {
        	switch(msg.type)
			{
				case "setUsername":
  					pub.publish("realtime", "1&&"+"A New Challenger Enters the Ring:" + socket.id +"  =  "+ msg.user);
  					break;
				case "sendscore":
  					list.zadd("myset", msg.score , msg.user);
					list.zrevrange("myset", 0 , 4, 'withscores', function(err,members){
						var lists=_.groupBy(members,function(a,b){
							return Math.floor(b/2);
						});
						//console.log( _.toArray(lists) );
						socket.emit("postscore",  _.toArray(lists) );
					});
  					break;
  				case "chat":
  					pub.publish("realtime", "1&&"+msg.message);
  					break;
  				case "sendarrow":
					pub.publish("realtime", "0&&"+msg.led1+"^"+msg.led2+"^"+msg.led3+"^"+msg.led4);
  					break;
  				case "sendvalveopen":
  					pub.publish("realtime", "1&&"+"Valve triggered.");
  					break;
				//default:
  				//	console.log("!!!received unknown input msg!!!");
			}
        });
        
        socket.on("error", function (err) {
        	console.log("Error "+err);
        });
        
        socket.on('timeline',function(msg){
        	switch(msg.type)
        	{
        		case "callblocks":
        			// get max limit
        			var timeline_end;
					list.get('global:next_tb_id', function(err,res){
					if (err){
						console.log("error: "+err);
					}
						timeline_end =res;
						getblockIDs();
					});
					
        			// convert dates and get block ids
        			var beginT = new Date(msg.begintime);
        			var endT = new Date(msg.endtime);
        			var begintime = beginT.getTime();
					var endtime = endT.getTime();
        			
        			var firstid;
        			var lastid;
        			var commands = [];
        			
        			function getblockIDs(){
						list.get("tb_time:"+begintime+":tb_id", function(err,res){
							if (err){
								console.log("error: "+err);
							}
							firstid = res;
							// if out of range
							if (firstid == null){
								firstid = 0;
								lastid = firstid + (3*60/5);
							}
							console.log("looking up : block # "+firstid);
						
							list.get("tb_time:"+endtime+":tb_id", function(err,res){
								if (err){
									console.log("error: "+err);
								}
								lastid = res;
								// if out of range
								if (lastid == null)
								{
									lastid = timeline_end;
									firstid = lastid - (3*60/5);
								}
								console.log(" ~  block # " +lastid);
							
								runCommands(firstid, lastid);
							});
						});
        			}
        			
        			function runCommands(first, last){
        				for (var i=first;i<=last;i++){
							commands.push(["get","tb_id:"+i+":time"]);
							commands.push(["get","tb_id:"+i+":locked"]);
							commands.push(["get","tb_id:"+i+":userid"]);
							commands.push(["get","tb_id:"+i+":expid"]);
						}
						list.multi(commands).exec(function (err, res) {
							if(err){
								console.log("error: "+err);
							}else{
								//console.log(res[0]);
								//console.log(res[1]);
								//console.log(res[2]);
								//console.log(res[3]);
								console.log( _.toArray(res)[0] );
								// emit results
								socket.emit('postblocks',  _.toArray(res) );
							}
						});
        			}
						/*JSONData.push({
							"id": i, 
							"time": list.get("tb_id:"+i+":time"),
							"lock": list.get("tb_id:"+i+":locked"),
							"userid": list.get("tb_id:"+i+":userid"),
							"expid": list.get("tb_id:"+i+":expid")
							});*/
        			break;
        		case "writeblocks":
        			// convert dates and get block ids
        			var targetdate = msg.targetdate;
        			var targetid = list.get("tb_time:"+targetdate+":tb_id");
        			break;
        	}
        });
        
        socket.on('lookclock', function(){
        	function display(date){
        		// display 5 min countdown
				var m = date.getMinutes();
				m="0" + (5-m%5);
				var s = date.getSeconds();
				s=("0" + (60-s)).slice(-2);
				return m+":"+s;
			}
        	socket.emit('server_clock',display(now));
        });
        
        socket.on('disconnect', function() {
            sub.quit();
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
		//console.log(now.getHours()+":"+now.getMinutes()+":"+now.getSeconds());
			//if (now.getDate() === 12 && now.getHours() === 12 && now.getMinutes() === 0) {
		//socket.emit('server_clock',"tic");        
		if (now.getSeconds() === 0){
				cb(now);
			}
			now = new Date();                  // allow for time passing
			var delay = 1000 - (now % 1000); // exact ms to next minute interval
			setTimeout(loop, delay);
		})();
	}

	function one_block(now){
		//console.log("!!!TIC!!!");
     	//past block: locked = 1, past = 1, take a snapshot, image = image_dir
     	//current block: current = 1
     	//reload page

     	//if (timeleft < 1000*60*2) current block: locked = 1
     	//reload blocks
	}
	                                             //
	//////////////////////////////////////////////
}


function markTimeblock(){
	var block = 5*60*1000;
	var start = Date.UTC(2014,02,11,0);
	//var end = Date.UTC(2014,07,01,0);
	var end = Date.getTime();
	var blocks = (end-start)/block;
	
	console.log(start);
	console.log(end);
	console.log(blocks);
	/*
     INCR global:next_tb_id
     SET tb_id:1000:time UTCtime()
     SET tb_id:1000:locked 0
     SET tb_id:1000:user_id -1
     SET tb_id:1000:exp_id -1
     SET tb_time:UTCtime:tb_id 1000
     */

     /*SET global:next_exp_id
     SET global:next_pattern_id
     SET tb_id:1000:pattern_id -1
     SET tb_id:1000:past 0
     SET tb_id:1000:admin 0
     SET tb_id:1000:current 0
     SET tb_id:1000:image -1*/
     
	/*for (var i=0;i<blocks;i++) {
		redis.set("tb_id:"+i+":locked", 1);
		redis.set("tb_id:"+i+":past", 1);
	}
	redis.set("tb_id:"+(blocks+1)+":current",1);*/
}