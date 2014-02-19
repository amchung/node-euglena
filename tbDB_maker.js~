const redis = require('redis');
const list = redis.createClient();

console.log("Populate time block DB: STARTED");

//from Feb 11 2014 0:00 am
//to Mar 1 2014 0:00 am
//for every 5min time block

var block = 5*60*1000;
var start = Date.UTC(2014,02,11,0);
var end = Date.UTC(2014,03,01,0);
var blocks = (end-start)/block;

	/*
     INCR global:next_tb_id
     SET tb_id:1000:time UTCtime()
     SET tb_id:1000:locked 0
     SET tb_id:1000:userid -1
     SET tb_id:1000:expid -1
     SET tb_time:UTCtime:tb_id 1000
     */

for (var i=0;i<blocks;i++) {
	var time = start + i * block;
	list.incr("global:next_tb_id");
	list.set("tb_id:"+i+":time", time);
	list.set("tb_id:"+i+":locked", 0);
	list.set("tb_id:"+i+":userid", -1);
	list.set("tb_id:"+i+":expid", -1);
	list.set("tb_time:"+time+":tb_id", i);
	console.log("UTC: "+time+" created");
}

console.log(">>>> Done.");