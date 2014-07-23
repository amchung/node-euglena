const redis = require('redis');
const list = redis.createClient();

console.log("Populate time block DB: STARTED");

/* don't use the below loop to populate future time blocks
 * check global:next_tb_id
 */
 
//for every 5min time block

var block = 5*60*1000;
//var start = Date.UTC(2014,02,1); // Mar 1 GMT
//var end = Date.UTC(2014,06,1); // July 1 GMT
var start_date = Date.UTC(2014,06,1);
var end_date = Date.UTC(2015,06,1);
var blocks = (end_date-start_date)/block;

//var start_i = 39873;

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

// global variables
list.set("global:next_tb_id",0);
list.set("global:next_exp_id",0);
list.set("global:next_pattern_id",1);
list.set("global:next_tag_id",1);

     
//for (var i=start_i;i<start_i+blocks;i++) {
for (var i=0;i<blocks;i++) {
	//var time = start_date + (i-start_i) * block;
	var time = start_date + i * block;
	
	list.incr("global:next_tb_id");
	list.set("tb_id:"+i+":time", time);
	list.set("tb_id:"+i+":locked", 0);
	list.set("tb_time:"+time+":tb_id", i);
	list.set("tb_id:"+i+":user_id", -1);
	list.set("tb_id:"+i+":exp_id", -1);
	list.set("tb_id:"+i+":pattern_id", -1);
	list.set("tb_id:"+i+":past", 0);
	list.set("tb_id:"+i+":admin", 0);
	list.set("tb_id:"+i+":current", 0);
	list.set("tb_id:"+i+":image", -1);
	list.set("tb_id:"+i+":username", -1);
	
	console.log("UTC: "+time+" created");
}



console.log(">>>> Done.");
