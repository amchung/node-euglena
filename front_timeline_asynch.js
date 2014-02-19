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

    socket.on('connection', function(client) {
        const sub = redis.createClient();
        sub.subscribe('realtime');
        const pub = redis.createClient();
        
    	list.zrevrange("myset", 0 , 4, 'withscores', function(err,members){
			var lists=_.groupBy(members,function(a,b){
				return Math.floor(b/2);
			});
			console.log( _.toArray(lists) );
			client.emit("postscore",  _.toArray(lists) );
		});
 
        sub.on("message", function(channel, message) {
            client.send(message);
        });
        
        client.on('message', function(msg) {
        	switch(msg.type)
			{
				case "setUsername":
  					pub.publish("realtime", "1&&"+"A New Challenger Enters the Ring:" + client.id +"  =  "+ msg.user);
  					break;
				case "sendscore":
  					list.zadd("myset", msg.score , msg.user);
					list.zrevrange("myset", 0 , 4, 'withscores', function(err,members){
						var lists=_.groupBy(members,function(a,b){
							return Math.floor(b/2);
						});
						//console.log( _.toArray(lists) );
						client.emit("postscore",  _.toArray(lists) );
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
        
        client.on("error", function (err) {
        	console.log("Error "+err);
        });
        
        client.on('timeline',function(msg){
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
								console.log( _.toArray(res) );
								// emit results
								client.emit("postblocks",  _.toArray(res) );
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
        
        client.on('disconnect', function() {
            sub.quit();
            pub.publish("realtime","Disconnected :" + client.id);
        });
    });
}

