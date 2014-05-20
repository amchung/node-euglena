const redis = require('redis');
const list = redis.createClient();

var start = 5883;
var blocks = 12*24*0.5+start;
var exp_id =     458;
for (var i=start;i<blocks;i++) {
	
	list.set("tb_id:"+i+":locked", 1);
	list.set("tb_id:"+i+":user_id", "52e82713809be5fa04a461f6");
	list.set("tb_id:"+i+":pattern_id", 5);
	list.set("tb_id:"+i+":past", 0);
	list.set("tb_id:"+i+":admin", 0);
	list.set("tb_id:"+i+":current", 0);
	list.set("tb_id:"+i+":image", -1);
	list.set("tb_id:"+i+":username", "amchung");

	list.set("tb_id:"+i+":exp_id",exp_id);

	console.log("exp_id: "+exp_id+"; created");
	exp_id = exp_id+1;
}

console.log(">>>> Done.");
