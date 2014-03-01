const redis = require('redis');
const list = redis.createClient();

console.log("Populate time block DB: STARTED");

//from Feb 11 2014 0:00 am
//to July 1 2014 0:00 am
//for every 5min time block

var block = 5*60*1000;
var start = Date.UTC(2014,02,11,0);
var end = Date.UTC(2014,07,01,0);
var blocks = (end-start)/block;

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
     
for (var i=0;i<blocks;i++) {
	if (i>31679){
	 	var time = start + i * block;
		list.incr("global:next_tb_id");
		list.set("tb_id:"+i+":time", time);
		list.set("tb_id:"+i+":locked", 0);
		list.set("tb_time:"+time+":tb_id", i);
	}else{
		list.del("tb_id:"+i+":userid");
		list.del("tb_id:"+i+":expid");
	}
	list.set("tb_id:"+i+":user_id", -1);
	list.set("tb_id:"+i+":exp_id", -1);
	list.set("tb_id:"+i+":pattern_id", -1);
	list.set("tb_id:"+i+":past", 0);
	list.set("tb_id:"+i+":admin", 0);
	list.set("tb_id:"+i+":current", 0);
	list.set("tb_id:"+i+":image", -1);
	
	console.log("UTC: "+time+" created");
}

console.log(">>>> Done.");