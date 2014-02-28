//////////////////////////////////////////////
//     server clock functions

var myVar;
onclock(one_tick);
var now = new Date();
console.log(now.getHours()+":"+now.getMinutes()+":"+now.getSeconds());

function onclock(cb) {
    (function loop() {
        var now = new Date();
	console.log(now.getHours()+":"+now.getMinutes()+":"+now.getSeconds());
        //if (now.getDate() === 12 && now.getHours() === 12 && now.getMinutes() === 0) {
        if (now.getMinutes() === 0){
            cb();
        }
        now = new Date();                  // allow for time passing
        var delay = 1000 - (now % 1000); // exact ms to next minute interval
        setTimeout(loop, delay);
    })();
}

function one_tick(){
	var now = new Date();
	console.log("tick");
}
