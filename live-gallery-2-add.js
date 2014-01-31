var snapshot_t_interval = 1000 * 60 * 10; // every 10 minutes
setInterval(takeSnapshot, snapshot_t_interval);
takeSnapshot();
setMorningRoutine();

function setMorningRoutine(){
	var now = new Date();
	var millisTill7 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0, 0) - now;
	if (millisTill7 < 0) {
     	millisTill7 += 86400000; // it's after 7am, try 7am tomorrow.
	}
	setTimeout(function(){morningRoutine, millisTill7);
}

function takeSnapshot(){
  var timestamp = new Date().getTime();
  
  http.get("http://171.65.102.132:8080/?action=snapshot?t=" + timestamp, function(res) {
        res.setEncoding('binary');
        var imagedata = '';
        res.on('data', function(chunk){
            imagedata+= chunk; 
        });
        res.on('end', function(){
        	var isoDate = new Date(timestamp).toISOString();
        	console.log("tmp/"+isoDate+".jpg");
        	var path = require('path');
        	var file = path.join(__dirname, 'tmp', isoDate+".jpg");
            fs.writeFile(file, imagedata, 'binary');
        });
    }).on('error', function(e) {
      		console.log("Got error: " + e.message);
	});
}

function morningRoutine(){
	var timestamp = new Date().getTime();
  
	setInterval(takeSnapshot, 1000/30);
  
	var tt=setInterval(function(){startTime()},1000);
	var counter = 1;

	function startTime()
	{
  		if(counter == 20*60*3) {
    		clearInterval(tt);
  		} else {
    		counter++;
  		}
  	takeSnapshot();  
	}
	setMorningRoutine();
}
